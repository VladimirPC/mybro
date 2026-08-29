import { defineHandler } from "nitro";
import { ASSET_LINKS_JSON } from "../../../scripts/assetlinks.mjs";

export default defineHandler(() => {
  return new Response(ASSET_LINKS_JSON, {
    headers: {
      "content-type": "application/json",
      "cache-control": "max-age=3600",
    },
  });
});
