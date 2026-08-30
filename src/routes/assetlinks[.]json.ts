import { createFileRoute } from "@tanstack/react-router";
import { ASSET_LINKS_JSON } from "../../scripts/assetlinks.mjs";

function assetLinksResponse() {
  return new Response(ASSET_LINKS_JSON, {
    headers: {
      "content-type": "application/json",
      "cache-control": "max-age=300",
      "access-control-allow-origin": "*",
    },
  });
}

export const Route = createFileRoute("/assetlinks.json")({
  server: {
    handlers: {
      GET: assetLinksResponse,
      HEAD: assetLinksResponse,
    },
  },
});
