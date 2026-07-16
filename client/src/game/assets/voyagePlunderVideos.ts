/**
 * Per-biome Higgsfield plunder cinematics (kling3_0_turbo, 5s, 16:9).
 * Optional — scene falls back to sprite plunder if a file is missing.
 */

import type { IslandBiomeId } from "@treasure-trap/shared";
import volcanoUrl from "../../assets/higgsfield/voyage/plunder/plunder-volcano.mp4";
import jungleUrl from "../../assets/higgsfield/voyage/plunder/plunder-jungle.mp4";
import skullUrl from "../../assets/higgsfield/voyage/plunder/plunder-skull.mp4";
import lagoonUrl from "../../assets/higgsfield/voyage/plunder/plunder-lagoon.mp4";
import shipwreckUrl from "../../assets/higgsfield/voyage/plunder/plunder-shipwreck.mp4";
import ruinsUrl from "../../assets/higgsfield/voyage/plunder/plunder-ruins.mp4";
import lighthouseUrl from "../../assets/higgsfield/voyage/plunder/plunder-lighthouse.mp4";
import mangroveUrl from "../../assets/higgsfield/voyage/plunder/plunder-mangrove.mp4";

export const PLUNDER_VIDEO: Record<
  IslandBiomeId,
  { key: string; url: string; jobId: string }
> = {
  volcano: {
    key: "voyage-plunder-volcano",
    url: volcanoUrl,
    jobId: "700d1020-f418-4e9f-afad-d4007c352a15",
  },
  jungle: {
    key: "voyage-plunder-jungle",
    url: jungleUrl,
    jobId: "33c2cf71-9e62-408c-95be-348df90141b0",
  },
  skull: {
    key: "voyage-plunder-skull",
    url: skullUrl,
    jobId: "3125c854-dc7b-4ebc-8549-2429dab542f8",
  },
  lagoon: {
    key: "voyage-plunder-lagoon",
    url: lagoonUrl,
    jobId: "3a8e0a11-7d83-4889-a54c-ccbcd800131c",
  },
  shipwreck: {
    key: "voyage-plunder-shipwreck",
    url: shipwreckUrl,
    jobId: "6f3efaad-5667-4bf2-9e4e-6dd4500652d7",
  },
  ruins: {
    key: "voyage-plunder-ruins",
    url: ruinsUrl,
    jobId: "6e396684-d177-4380-b35b-bb7aed07e495",
  },
  lighthouse: {
    key: "voyage-plunder-lighthouse",
    url: lighthouseUrl,
    jobId: "327c472f-dde4-4ebb-97b9-2c9243e7cd90",
  },
  mangrove: {
    key: "voyage-plunder-mangrove",
    url: mangroveUrl,
    jobId: "c329d9e7-d974-4b7e-b2a8-fc3b2a71ea1f",
  },
};

export function preloadPlunderVideos(load: {
  video: (key: string, url: string, noAudio?: boolean) => unknown;
}): void {
  for (const asset of Object.values(PLUNDER_VIDEO)) {
    load.video(asset.key, asset.url, true);
  }
}
