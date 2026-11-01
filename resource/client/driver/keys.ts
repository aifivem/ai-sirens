import { drivenVehicle, Keybind } from "@aicore-fivem/lib/client";
import { Locale } from "common";
import { SIREN_BAGS } from "common/sirens";
import { lightbarOf } from "../lightbar";
import { ask, isEmergency, stateOf, type SirenKey } from "../state";

export const level = (vehicle: number, key: SirenKey) => {
  const v = stateOf(vehicle, key);
  return typeof v === "number" ? v : 0;
};
const click = (vehicle: number, up: boolean) =>
  PlaySoundFromEntity(
    -1,
    up ? "NAV_UP_DOWN" : "BACK",
    vehicle,
    "HUD_FRONTEND_DEFAULT_SOUNDSET",
    false,
    0,
  );
/** The emergency vehicle the player drives, or 0. */
export const driven = (): number => {
  const vehicle = drivenVehicle();
  return vehicle !== false && isEmergency(vehicle) && !IsPauseMenuActive()
    ? vehicle
    : 0;
};

export const keys = {
  lights: new Keybind({
    name: "siren_lights",
    description: Locale("KEYBIND_LIGHTS"),
    defaultKey: "Q",
    disabled: true,
    onReleased: () => {
      const vehicle = driven();
      if (!vehicle) return;
      const on = !IsVehicleSirenOn(vehicle);
      click(vehicle, on);
      SetVehicleSiren(vehicle, on);
      const bar = lightbarOf(vehicle);
      if (bar) SetVehicleSiren(bar, on);
    },
  }),
  siren: new Keybind({
    name: "siren_toggle",
    description: Locale("KEYBIND_SIREN"),
    defaultKey: "LMENU",
    disabled: true,
    onReleased: () => {
      const vehicle = driven();
      if (!vehicle) return;
      if (level(vehicle, SIREN_BAGS.tone) > 0) {
        click(vehicle, false);
        ask(vehicle, SIREN_BAGS.tone, 0);
      } else if (IsVehicleSirenOn(vehicle)) {
        click(vehicle, true);
        ask(vehicle, SIREN_BAGS.tone, 1);
      }
    },
  }),
  cycle: new Keybind({
    name: "siren_cycle",
    description: Locale("KEYBIND_CYCLE"),
    defaultKey: "Y",
    disabled: true,
    onReleased: () => {
      const vehicle = driven();
      const current = vehicle ? level(vehicle, SIREN_BAGS.tone) : 0;
      if (!vehicle || current === 0 || !IsVehicleSirenOn(vehicle)) return;
      click(vehicle, true);
      ask(vehicle, SIREN_BAGS.tone, (current % 3) + 1);
    },
  }),
  horn: new Keybind({
    name: "siren_horn",
    description: Locale("KEYBIND_HORN"),
    defaultKey: "E",
    disabled: true,
  }),
};
