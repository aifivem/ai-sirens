import {
  AdminPanel,
  entityCoords,
  EntityState,
  isNear,
  onClientEvent,
  stateString,
  vehicleFromNet,
} from "@aicore-fivem/lib/server";
import { readId } from "@aicore-fivem/lib/shared";
import { EVENTS, readSettings, SIREN_BAGS, toLevel } from "common/sirens";
import { schema } from "./schema";

const panel = new AdminPanel(schema);
const settings = panel.view("settings", (raw) => {
  const s = readSettings(raw);
  return {
    ...s,
    /** Hashes of the emergency models (empty: every model), checked per request without string work. */
    emergency: new Set(s.emergencyModels.map((m) => GetHashKey(m))),
    lightbarNames: new Set(Object.values(s.lightbarModels)),
  };
});

/** A player who is not the driver may only reset a siren (to 0), and only from this close. */
const RESET_METRES = 10;

const tone = new EntityState(SIREN_BAGS.tone, toLevel);
const manual = new EntityState(SIREN_BAGS.manual, toLevel);
const lightbar = new EntityState(SIREN_BAGS.lightbar, stateString);

type Request =
  | { netId: number; key: typeof SIREN_BAGS.lightbar; model: string | null }
  | {
      netId: number;
      key: typeof SIREN_BAGS.tone | typeof SIREN_BAGS.manual;
      level: number;
    };

/** `[netId, key, value]` with the value checked for its key: a level 0-3 for tone / airhorn, a model or null for the lightbar. */
function readRequest([netId, key, value]: unknown[]): [Request] | null {
  const id = readId(netId);
  if (id === null) return null;
  if (key === SIREN_BAGS.lightbar)
    return value === null || (typeof value === "string" && value.length <= 32)
      ? [{ netId: id, key, model: value }]
      : null;
  if (key !== SIREN_BAGS.tone && key !== SIREN_BAGS.manual) return null;
  const level = toLevel(value);
  return level === undefined ? null : [{ netId: id, key, level }];
}

const isEmergency = (vehicle: number): boolean =>
  settings.value.emergency.size === 0 ||
  settings.value.emergency.has(GetEntityModel(vehicle));

/**
 * Siren states asked by clients, only on panel-listed emergency models: tones and the airhorn from the driver; a
 * reset to 0 also from a player within 10 m while the driver seat is empty (leaving the car); the lightbar model only
 * from the vehicle's network owner and only a model the panel lists.
 */
onClientEvent(
  EVENTS.setState,
  { args: readRequest, rate: { count: 20, windowMs: 1000 } },
  (source, request) => {
    const vehicle = vehicleFromNet(request.netId);
    if (!vehicle || !isEmergency(vehicle)) return;
    if (request.key === SIREN_BAGS.lightbar) {
      const { model } = request;
      if (NetworkGetEntityOwner(vehicle) !== source) return;
      if (model === null) return lightbar.set(vehicle, undefined);
      if (settings.value.lightbarNames.has(model)) lightbar.set(vehicle, model);
      return;
    }
    const driver = GetPedInVehicleSeat(vehicle, -1);
    if (driver !== GetPlayerPed(String(source))) {
      if (
        request.level !== 0 ||
        driver > 0 ||
        !isNear(source, entityCoords(vehicle), RESET_METRES)
      )
        return;
    }
    if (request.key === SIREN_BAGS.tone) tone.set(vehicle, request.level);
    else manual.set(vehicle, request.level);
  },
);
