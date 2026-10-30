import { AdminWorld, EntityState, stateString } from "@aicore-fivem/lib/client";
import { EVENTS, readSettings, SIREN_BAGS, toLevel } from "common/sirens";

const hashes = (models: string[]) => new Set(models.map((m) => GetHashKey(m)));

export const world = new AdminWorld(["settings"]);
/** The settings plus model hash sets, rebuilt only when the panel changes (read every frame while driving). */
export const settings = world.view("settings", (raw) => {
  const s = readSettings(raw);
  return {
    ...s,
    emergency: hashes(s.emergencyModels),
    fire: hashes(s.fireSirenModels),
    powercall: hashes(s.powercallModels),
    onx: hashes(s.onxModels),
  };
});

export const tone = new EntityState(SIREN_BAGS.tone, toLevel);
export const manual = new EntityState(SIREN_BAGS.manual, toLevel);
export const lightbar = new EntityState(SIREN_BAGS.lightbar, stateString);

const SLOTS = {
  [SIREN_BAGS.tone]: 0,
  [SIREN_BAGS.manual]: 1,
  [SIREN_BAGS.lightbar]: 2,
} as const;
export type SirenKey = keyof typeof SLOTS;
/** A request the server neither answered nor confirmed in this time counts as refused. */
const ASK_MS = 1500;

/** What this client asked last per vehicle and key (`vehicle * 4 + slot`), read until the server's value arrives. */
const asked = new Map<number, { value: number | string | null; at: number }>();

/** The siren state of a vehicle: this client's last request while it waits, else the replicated value. */
export function stateOf(
  vehicle: number,
  key: SirenKey,
): number | string | undefined {
  const id = vehicle * 4 + SLOTS[key];
  const mine = asked.get(id);
  if (mine !== undefined) {
    if (GetGameTimer() - mine.at < ASK_MS) return mine.value ?? undefined;
    asked.delete(id);
  }
  if (key === SIREN_BAGS.tone) return tone.get(vehicle);
  if (key === SIREN_BAGS.manual) return manual.get(vehicle);
  return lightbar.get(vehicle);
}

/** Asks the server to set a siren state (it checks the driver / owner and sets the bag). */
export function ask(
  vehicle: number,
  key: SirenKey,
  value: number | string | null,
): void {
  asked.set(vehicle * 4 + SLOTS[key], { value, at: GetGameTimer() });
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
    if (vehicle) asked.delete(vehicle * 4 + SLOTS[key]);
  });

/** An emergency class vehicle the panel lists (an empty list allows every one); the server checks the list too. */
export const isEmergency = (vehicle: number): boolean =>
  GetVehicleClass(vehicle) === 18 &&
  (settings.value.emergency.size === 0 ||
    settings.value.emergency.has(GetEntityModel(vehicle)));
export const isFireSiren = (vehicle: number) =>
  settings.value.fire.has(GetEntityModel(vehicle));
export const isPowercall = (vehicle: number) =>
  settings.value.powercall.has(GetEntityModel(vehicle));

/** The tone sounds of a vehicle: ONX tones for listed models and vehicles with an ONX lightbar, else the default set. */
export function tonesOf(vehicle: number) {
  const s = settings.value;
  const onx =
    s.onx.has(GetEntityModel(vehicle)) ||
    stateOf(vehicle, SIREN_BAGS.lightbar) !== undefined;
  return onx ? s.onxTones : s.defaultTones;
}
