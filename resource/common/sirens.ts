import { bool, int, record } from "@aicore-fivem/lib/shared";

/** Vehicle state bags (written by the server after its checks; every client in scope plays them). */
export const SIREN_BAGS = {
  /** Main siren tone: 0 off, 1-3 a tone. */
  tone: "siren:lx",
  /** Airhorn / manual siren: 0 off, 1 horn, 2 manual, 3 both. */
  manual: "siren:manu",
  /** The ONX lightbar model attached to the vehicle (absent: none). */
  lightbar: "siren:lightbar",
} as const;

export const EVENTS = {
  /** Client -> server: (netId, key, value) the driver changes a siren state, or the owner the lightbar model. */
  setState: "ai-sirens:setState",
} as const;

export const toLevel = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 3
    ? v
    : undefined;

export interface ToneSet {
  tone1: string;
  tone2: string;
  tone3: string;
}

export interface Settings {
  /** Models whose sirens the server accepts (empty: every model). */
  emergencyModels: string[];
  disableDistantSirens: boolean;
  stopOnDriverExit: boolean;
  /** Models keeping their real wail from vehicles.meta (firetrucks). */
  fireSirenModels: string[];
  /** Models whose first tone is the ambulance powercall. */
  powercallModels: string[];
  defaultTones: ToneSet;
  onxTones: ToneSet;
  /** Models forced to the ONX tones. */
  onxModels: string[];
  lightbars: boolean;
  lightbarMod: number;
  /** Tuning value of the mod slot -> lightbar model. */
  lightbarModels: Record<number, string>;
}

const names = (v: unknown): string[] =>
  Array.isArray(v)
    ? v
        .filter((x): x is string => typeof x === "string")
        .map((x) => x.toLowerCase())
    : [];
const text = (v: unknown, fallback: string) =>
  typeof v === "string" && v ? v : fallback;
const tones = (v: unknown, d: ToneSet): ToneSet => {
  const r = record(v);
  return {
    tone1: text(r.tone1, d.tone1),
    tone2: text(r.tone2, d.tone2),
    tone3: text(r.tone3, d.tone3),
  };
};

export const DEFAULT_TONES: ToneSet = {
  tone1: "VEHICLES_HORNS_SIREN_1",
  tone2: "VEHICLES_HORNS_SIREN_2",
  tone3: "VEHICLES_HORNS_POLICE_WARNING",
};
export const ONX_TONES: ToneSet = {
  tone1: "RESIDENT_VEHICLES_SIREN_WAIL_02",
  tone2: "RESIDENT_VEHICLES_SIREN_QUICK_02",
  tone3: "VEHICLES_HORNS_POLICE_WARNING",
};

export function readSettings(raw: unknown): Settings {
  const s = record(raw);
  const lightbarModels: Record<number, string> = {};
  for (const row of Array.isArray(s.lightbarModels) ? s.lightbarModels : []) {
    const r = record(row);
    const mod = int(r.mod, -1, 0, 100);
    if (mod >= 0 && typeof r.model === "string" && r.model)
      lightbarModels[mod] = r.model.toLowerCase();
  }
  return {
    emergencyModels: names(s.emergencyModels),
    disableDistantSirens: bool(s.disableDistantSirens, true),
    stopOnDriverExit: bool(s.stopOnDriverExit, true),
    fireSirenModels: names(s.fireSirenModels),
    powercallModels: names(s.powercallModels),
    defaultTones: tones(s.defaultTones, DEFAULT_TONES),
    onxTones: tones(s.onxTones, ONX_TONES),
    onxModels: names(s.onxModels),
    lightbars: bool(s.lightbars, true),
    lightbarMod: int(s.lightbarMod, 49, 0, 49),
    lightbarModels,
  };
}
