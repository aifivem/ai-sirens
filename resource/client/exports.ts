import { cache, registerExport } from "@aicore-fivem/lib/client";
import { readInt } from "@aicore-fivem/lib/shared";
import { SIREN_BAGS } from "common/sirens";
import { lightbarOf } from "./lightbar";
import { ask, isEmergency, stateOf, type SirenKey } from "./state";

/** Siren control for other scripts, the same as the keys; state changes work on the driver's client. */
const vehicleOf = (v: unknown): number => {
  const vehicle = typeof v === "number" ? v : cache.vehicle;
  return vehicle && DoesEntityExist(vehicle) && isEmergency(vehicle)
    ? vehicle
    : 0;
};
const level = (vehicle: number, key: SirenKey) => {
  const v = stateOf(vehicle, key);
  return typeof v === "number" ? v : 0;
};
function setLights(vehicle: number, on: boolean): void {
  SetVehicleSiren(vehicle, on);
  const bar = lightbarOf(vehicle);
  if (bar) SetVehicleSiren(bar, on);
}

registerExport("SetLights", (v: unknown, on: unknown) => {
  const vehicle = vehicleOf(v);
  if (vehicle) setLights(vehicle, on === true);
  return vehicle !== 0;
});
registerExport("ToggleLights", (v: unknown) => {
  const vehicle = vehicleOf(v);
  if (vehicle) setLights(vehicle, !IsVehicleSirenOn(vehicle));
  return vehicle !== 0;
});
registerExport("SetSirenTone", (v: unknown, tone: unknown) => {
  const vehicle = vehicleOf(v);
  const value =
    typeof tone === "number" ? readInt(Math.floor(tone), 0, 3) : null;
  if (!vehicle || value === null) return false;
  if (value > 0 && !IsVehicleSirenOn(vehicle)) setLights(vehicle, true);
  ask(vehicle, SIREN_BAGS.tone, value);
  return true;
});
registerExport("ToggleSiren", (v: unknown) => {
  const vehicle = vehicleOf(v);
  if (!vehicle) return false;
  if (level(vehicle, SIREN_BAGS.tone) > 0) ask(vehicle, SIREN_BAGS.tone, 0);
  else {
    if (!IsVehicleSirenOn(vehicle)) setLights(vehicle, true);
    ask(vehicle, SIREN_BAGS.tone, 1);
  }
  return true;
});
registerExport("CycleTone", (v: unknown) => {
  const vehicle = vehicleOf(v);
  if (!vehicle) return false;
  const tone = level(vehicle, SIREN_BAGS.tone);
  if (tone === 0 && !IsVehicleSirenOn(vehicle)) setLights(vehicle, true);
  ask(vehicle, SIREN_BAGS.tone, tone > 0 ? (tone % 3) + 1 : 1);
  return true;
});
registerExport("GetSirenTone", (v: unknown) => {
  const vehicle = vehicleOf(v);
  return vehicle ? level(vehicle, SIREN_BAGS.tone) : 0;
});
registerExport("AreLightsOn", (v: unknown) => {
  const vehicle = vehicleOf(v);
  return vehicle !== 0 && IsVehicleSirenOn(vehicle);
});
registerExport("GetAirManuState", (v: unknown) => {
  const vehicle = vehicleOf(v);
  return vehicle ? level(vehicle, SIREN_BAGS.manual) : 0;
});
registerExport("GetLightbarModel", (v: unknown) => {
  const vehicle = vehicleOf(v);
  return vehicle ? (stateOf(vehicle, SIREN_BAGS.lightbar) ?? null) : null;
});
