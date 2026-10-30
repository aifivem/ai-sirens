import { AdminWorld, EntityState, stateString } from "@aicore-fivem/lib/client";
import { EVENTS, readSettings, SIREN_BAGS, toLevel } from "common/sirens";

export const world = new AdminWorld(["settings"]);
export const content = { settings: readSettings(world.get("settings")) };
world.onChange(
  "settings",
  () => (content.settings = readSettings(world.get("settings"))),
);

export const tone = new EntityState(SIREN_BAGS.tone, toLevel);
export const manual = new EntityState(SIREN_BAGS.manual, toLevel);
export const lightbar = new EntityState(SIREN_BAGS.lightbar, stateString);

/** What this client asked last per vehicle and key, read until the server's value arrives (per-frame reads settle at once). */
const asked = new Map<string, number | string | null>();

/** The siren state of a vehicle: this client's last request while it waits, else the replicated value. */
export function stateOf(
  vehicle: number,
  key: string,
): number | string | undefined {
  const mine = asked.get(`${vehicle}:${key}`);
  if (mine !== undefined) return mine ?? undefined;
  if (key === SIREN_BAGS.tone) return tone.get(vehicle);
  if (key === SIREN_BAGS.manual) return manual.get(vehicle);
  return lightbar.get(vehicle);
}

/** Asks the server to set a siren state (it checks the driver / owner and sets the bag). */
export function ask(
  vehicle: number,
  key: string,
  value: number | string | null,
): void {
  asked.set(`${vehicle}:${key}`, value);
  emitNet(EVENTS.setState, NetworkGetNetworkIdFromEntity(vehicle), key, value);
}

// The replicated value replaces the request it answers.
for (const [state, key] of [
  [tone, SIREN_BAGS.tone],
  [manual, SIREN_BAGS.manual],
  [lightbar, SIREN_BAGS.lightbar],
] as const)
  (state as EntityState<number | string>).onChange((netId) => {
    const vehicle = NetworkDoesEntityExistWithNetworkId(netId)
      ? NetToVeh(netId)
      : 0;
    if (vehicle) asked.delete(`${vehicle}:${key}`);
  });

const hashes = (models: string[]) => new Set(models.map((m) => GetHashKey(m)));
export const isFireSiren = (vehicle: number) =>
  hashes(content.settings.fireSirenModels).has(GetEntityModel(vehicle));
export const isPowercall = (vehicle: number) =>
  hashes(content.settings.powercallModels).has(GetEntityModel(vehicle));

/** The tone sounds of a vehicle: ONX tones for listed models and vehicles with an ONX lightbar, else the default set. */
export function tonesOf(vehicle: number) {
  const onx =
    hashes(content.settings.onxModels).has(GetEntityModel(vehicle)) ||
    stateOf(vehicle, SIREN_BAGS.lightbar) !== undefined;
  return onx ? content.settings.onxTones : content.settings.defaultTones;
}
