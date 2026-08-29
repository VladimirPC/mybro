import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql, type Sql } from "@/lib/db";
import { computeStats } from "@/lib/stats";
import {
  DEFAULT_PLAN,
  normalizeSettings,
  type CigaretteLog,
  type ReductionPlan,
  type ResistedLog,
  type Settings,
  type TriggerId,
} from "@/lib/types";

export type CloudSnapshot = {
  onboarded: boolean;
  logs: CigaretteLog[];
  resisted: ResistedLog[];
  settings: Settings;
  plan: ReductionPlan;
  lastFactId: string | null;
};

export type CirclePerson = {
  userId: string;
  name: string;
  today: number;
  limit: number | null;
  lastAt: number | null;
  daysTracked: number;
  allTimeAvg: number;
  overLimit: boolean;
};

export type CircleInfo = {
  inviteCode: string;
  displayName: string;
  watching: CirclePerson[];
  watchedBy: { userId: string; name: string }[];
};

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode() {
  let s = "";
  for (let i = 0; i < 6; i += 1) {
    s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return s;
}

function asMs(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
    const t = Date.parse(value);
    if (Number.isFinite(t)) return t;
  }
  return 0;
}

async function ensureProfile(sql: Sql, userId: string, name: string) {
  const existing = await sql<{ user_id: string; invite_code: string; display_name: string }>`
    select user_id, invite_code, display_name from profiles where user_id = ${userId}
  `;
  const row = existing[0];
  if (row) {
    if (name && name !== row.display_name) {
      await sql`update profiles set display_name = ${name} where user_id = ${userId}`;
      return { ...row, display_name: name };
    }
    return row;
  }
  for (let i = 0; i < 8; i += 1) {
    const code = randomCode();
    try {
      await sql`
        insert into profiles (user_id, display_name, invite_code)
        values (${userId}, ${name}, ${code})
      `;
      return { user_id: userId, invite_code: code, display_name: name };
    } catch {
      /* unique collision — retry */
    }
  }
  throw new Error("Не удалось выдать код связи");
}

async function loadSnapshot(sql: Sql, userId: string): Promise<CloudSnapshot | null> {
  const state = await sql<{
    onboarded: boolean;
    settings: Settings | string;
    plan: ReductionPlan | string;
    last_fact_id: string | null;
  }>`
    select onboarded, settings, plan, last_fact_id from smoke_state where user_id = ${userId}
  `;
  const row = state[0];
  if (!row) return null;

  const logs = await sql<{ id: string; at_ms: number; trigger: string | null }>`
    select id, (extract(epoch from at) * 1000)::float8 as at_ms, trigger
    from smoke_logs where user_id = ${userId} order by at
  `;
  const resisted = await sql<{ id: string; at_ms: number }>`
    select id, (extract(epoch from at) * 1000)::float8 as at_ms
    from resisted_logs where user_id = ${userId} order by at
  `;

  const settingsRaw = typeof row.settings === "string" ? JSON.parse(row.settings) : row.settings;
  const planRaw = typeof row.plan === "string" ? JSON.parse(row.plan) : row.plan;

  return {
    onboarded: Boolean(row.onboarded),
    logs: logs.map((l) => ({
      id: l.id,
      at: asMs(l.at_ms),
      trigger: (l.trigger as TriggerId) || undefined,
    })),
    resisted: resisted.map((l) => ({ id: l.id, at: asMs(l.at_ms) })),
    settings: normalizeSettings(settingsRaw),
    plan: { ...DEFAULT_PLAN, ...(planRaw ?? {}) },
    lastFactId: row.last_fact_id,
  };
}

function personFromSnapshot(userId: string, name: string, snap: CloudSnapshot): CirclePerson {
  const stats = computeStats(snap.logs, snap.resisted, snap.settings, snap.plan);
  return {
    userId,
    name,
    today: stats.today,
    limit: stats.limit,
    lastAt: stats.lastAt,
    daysTracked: stats.daysTracked,
    allTimeAvg: stats.allTimeAvg,
    overLimit: stats.overLimit,
  };
}

export const pullMyState = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return loadSnapshot(sql, context.userId);
  });

export const pushMyState = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: CloudSnapshot & { name?: string }) => data)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const name = (data.name ?? "").trim().slice(0, 80);
    await ensureProfile(sql, context.userId, name);

    await sql.query(
      `insert into smoke_state (user_id, onboarded, settings, plan, last_fact_id, updated_at)
       values ($1, $2, $3::jsonb, $4::jsonb, $5, now())
       on conflict (user_id) do update set
         onboarded = excluded.onboarded,
         settings = excluded.settings,
         plan = excluded.plan,
         last_fact_id = excluded.last_fact_id,
         updated_at = now()`,
      [
        context.userId,
        data.onboarded,
        JSON.stringify(data.settings ?? {}),
        JSON.stringify(data.plan ?? {}),
        data.lastFactId,
      ],
    );

    await sql`delete from smoke_logs where user_id = ${context.userId}`;
    await sql`delete from resisted_logs where user_id = ${context.userId}`;

    const logs = (data.logs ?? []).slice(-4000);
    for (const log of logs) {
      const trigger = log.trigger ?? null;
      await sql`
        insert into smoke_logs (id, user_id, at, trigger)
        values (${log.id}, ${context.userId}, to_timestamp(${log.at / 1000}), ${trigger})
      `;
    }
    const resisted = (data.resisted ?? []).slice(-2000);
    for (const row of resisted) {
      await sql`
        insert into resisted_logs (id, user_id, at)
        values (${row.id}, ${context.userId}, to_timestamp(${row.at / 1000}))
      `;
    }
    return { ok: true as const };
  });

export const getCircle = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<CircleInfo> => {
    const sql = await getSql();
    const me = await ensureProfile(sql, context.userId, "");

    const watchingRows = await sql<{ smoker_id: string; display_name: string }>`
      select c.smoker_id, coalesce(p.display_name, '') as display_name
      from companions c
      left join profiles p on p.user_id = c.smoker_id
      where c.watcher_id = ${context.userId}
    `;
    const watchedRows = await sql<{ watcher_id: string; display_name: string }>`
      select c.watcher_id, coalesce(p.display_name, '') as display_name
      from companions c
      left join profiles p on p.user_id = c.watcher_id
      where c.smoker_id = ${context.userId}
    `;

    const watching: CirclePerson[] = [];
    for (const row of watchingRows) {
      const snap = await loadSnapshot(sql, row.smoker_id);
      if (!snap) {
        watching.push({
          userId: row.smoker_id,
          name: row.display_name || "Друг",
          today: 0,
          limit: null,
          lastAt: null,
          daysTracked: 0,
          allTimeAvg: 0,
          overLimit: false,
        });
        continue;
      }
      watching.push(personFromSnapshot(row.smoker_id, row.display_name || "Друг", snap));
    }

    return {
      inviteCode: me.invite_code,
      displayName: me.display_name,
      watching,
      watchedBy: watchedRows.map((r) => ({
        userId: r.watcher_id,
        name: r.display_name || "Наблюдатель",
      })),
    };
  });

export const followByCode = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((code: string) => code.trim().toUpperCase())
  .handler(async ({ context, data: code }) => {
    if (code.length < 4) throw new Error("Короткий код");
    const sql = await getSql();
    await ensureProfile(sql, context.userId, "");
    const found = await sql<{ user_id: string; display_name: string }>`
      select user_id, display_name from profiles where invite_code = ${code}
    `;
    const target = found[0];
    if (!target) throw new Error("Код не найден");
    if (target.user_id === context.userId) throw new Error("Это ваш собственный код");
    await sql`
      insert into companions (smoker_id, watcher_id)
      values (${target.user_id}, ${context.userId})
      on conflict do nothing
    `;
    return { ok: true as const, name: target.display_name || "Друг", userId: target.user_id };
  });

export const unfollow = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((smokerId: string) => smokerId)
  .handler(async ({ context, data: smokerId }) => {
    const sql = await getSql();
    await sql`
      delete from companions
      where smoker_id = ${smokerId} and watcher_id = ${context.userId}
    `;
    return { ok: true as const };
  });

export const getCompanionState = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((smokerId: string) => smokerId)
  .handler(async ({ context, data: smokerId }) => {
    const sql = await getSql();
    const allowed = await sql<{ smoker_id: string }>`
      select smoker_id from companions
      where smoker_id = ${smokerId} and watcher_id = ${context.userId}
    `;
    if (!allowed[0]) throw new Error("Нет доступа");
    const profile = await sql<{ display_name: string }>`
      select display_name from profiles where user_id = ${smokerId}
    `;
    const snap = await loadSnapshot(sql, smokerId);
    if (!snap) {
      return {
        name: profile[0]?.display_name || "Друг",
        snapshot: {
          onboarded: false,
          logs: [],
          resisted: [],
          settings: normalizeSettings(undefined),
          plan: DEFAULT_PLAN,
          lastFactId: null,
        } satisfies CloudSnapshot,
      };
    }
    return { name: profile[0]?.display_name || "Друг", snapshot: snap };
  });
