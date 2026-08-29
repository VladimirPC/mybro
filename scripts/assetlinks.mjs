/** Digital Asset Links for the PWABuilder TWA `me.grok.mybrobreathe.twa`. */

export const ASSET_LINKS = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: "me.grok.mybrobreathe.twa",
      sha256_cert_fingerprints: [
        "61:CC:60:7F:05:FC:AA:1D:31:DB:69:01:3B:45:D4:E5:9A:F9:C0:4F:30:CB:A4:42:23:2B:E9:65:AD:38:8A:01",
      ],
    },
  },
];

export const ASSET_LINKS_JSON = `${JSON.stringify(ASSET_LINKS, null, 2)}\n`;
export const ASSET_LINKS_PATH = "/.well-known/assetlinks.json";

function send(res) {
  const body = Buffer.from(ASSET_LINKS_JSON, "utf8");
  res.statusCode = 200;
  res.setHeader("content-type", "application/json");
  res.setHeader("cache-control", "max-age=3600");
  res.setHeader("content-length", String(body.byteLength));
  res.end(body);
}

export function assetLinksPlugin() {
  const middleware = (req, res, next) => {
    const pathOnly = (req.url ?? "").split("?", 1)[0] ?? "";
    if ((req.method ?? "GET").toUpperCase() !== "GET" || pathOnly !== ASSET_LINKS_PATH) {
      next();
      return;
    }
    send(res);
  };
  return {
    name: "dyshi-assetlinks",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}
