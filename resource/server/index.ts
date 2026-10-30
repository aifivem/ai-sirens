import {
  AdminPanel,
  EntityState,
  onClientEvent,
  stateString,
} from "@aicore-fivem/lib/server";
import { EVENTS, readSettings, SIREN_BAGS, toLevel } from "common/sirens";
import { schema } from "./schema";

const panel = new AdminPanel(schema);
let settings = readSettings(panel.get("settings"));
panel.onChange(
  "settings",
  () => (settings = readSettings(panel.get("settings"))),
);

const tone = new EntityState(SIREN_BAGS.tone, toLevel);
const manual = new EntityState(SIREN_BAGS.manual, toLevel);
const lightbar = new EntityState(SIREN_BAGS.lightbar, stateString);

/**
 * Siren states asked by clients: tones and the airhorn only from the driver (or anyone while the seat is empty),
 * the lightbar model only from the vehicle's network owner and only a model the panel lists.
 */
onClientEvent(
  EVENTS.setState,
  {
    args: ([netId, key, value]) =>
      typeof netId === "number" && typeof key === "string"
        ? [netId, key, value]
        : null,
    rate: { count: 20, windowMs: 1000 },
  },
  (source, netId, key, value) => {
    const vehicle = NetworkGetEntityFromNetworkId(netId);
    if (!vehicle || !DoesEntityExist(vehicle) || GetEntityType(vehicle) !== 2)
      return;
    if (key === SIREN_BAGS.lightbar) {
      if (NetworkGetEntityOwner(vehicle) !== source) return;
      if (value === null || value === undefined)
        return lightbar.set(vehicle, undefined);
      if (
        typeof value === "string" &&
        Object.values(settings.lightbarModels).includes(value)
      )
        lightbar.set(vehicle, value);
      return;
    }
    const level = toLevel(value);
    if (level === undefined) return;
    const driver = GetPedInVehicleSeat(vehicle, -1);
    if (driver > 0 && driver !== GetPlayerPed(String(source))) return;
    if (key === SIREN_BAGS.tone) tone.set(vehicle, level);
    else if (key === SIREN_BAGS.manual) manual.set(vehicle, level);
  },
);
