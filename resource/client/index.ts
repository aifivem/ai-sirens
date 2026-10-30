import {
  cache,
  controls,
  Keybind,
  onCache,
  TickLoop,
} from "@aicore-fivem/lib/client";
import { Locale } from "common";
import { SIREN_BAGS } from "common/sirens";
import "./exports";
import { lightbarOf } from "./lightbar";
import "./sounds";
import {
  ask,
  isEmergency,
  isFireSiren,
  settings,
  stateOf,
  world,
  type SirenKey,
} from "./state";

/** Horn, radio and cinematic camera keys while driving an emergency vehicle (the siren keys take their place). */
const BLOCKED = [86, 81, 82, 85, 80, 83, 84];
const level = (vehicle: number, key: SirenKey) => {
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
const driven = () =>
  cache.seat === -1 &&
  cache.vehicle !== false &&
  isEmergency(cache.vehicle) &&
  !IsPauseMenuActive()
    ? cache.vehicle
    : 0;

const keys = {
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

/** What the driver's keys did last: the airhorn state sent and the tone muted under the airhorn. */
const driver = { sentManual: 0, muted: 0 };

/** Every frame while driving an emergency vehicle: lights off resets the siren, held keys make the airhorn / manual siren. */
const loop = new TickLoop(() => {
  const vehicle = driven();
  if (!vehicle) return;
  let current = level(vehicle, SIREN_BAGS.tone);
  if (!IsVehicleSirenOn(vehicle) && current > 0) {
    PlaySoundFrontend(-1, "NAV_UP_DOWN", "HUD_FRONTEND_DEFAULT_SOUNDSET", true);
    ask(vehicle, SIREN_BAGS.tone, 0);
    current = 0;
  }
  const manualHeld = current < 1 && keys.cycle.isPressed;
  const horn = keys.horn.isPressed;
  const state = horn && manualHeld ? 3 : horn ? 1 : manualHeld ? 2 : 0;
  // The airhorn mutes the main tone and gives it back on release (firetrucks keep their wail).
  if (!isFireSiren(vehicle)) {
    if (state === 1 && current > 0 && !driver.muted) {
      driver.muted = current;
      ask(vehicle, SIREN_BAGS.tone, 0);
    } else if (state !== 1 && driver.muted) {
      ask(vehicle, SIREN_BAGS.tone, driver.muted);
      driver.muted = 0;
    }
  }
  if (driver.sentManual !== state) {
    driver.sentManual = state;
    ask(vehicle, SIREN_BAGS.manual, state);
  }
});

/** Entering or leaving the driver seat of an emergency vehicle. */
function update(): void {
  const vehicle = driven();
  for (const k of Object.values(keys)) k.disable(!vehicle);
  loop.set(vehicle !== 0);
  if (vehicle) {
    driver.sentManual = 0;
    driver.muted = 0;
    controls.disable("siren", BLOCKED);
    SetVehRadioStation(vehicle, "OFF");
    SetVehicleRadioEnabled(vehicle, false);
    // Seeding the bag mutes GTA's own wail for everyone in scope.
    if (stateOf(vehicle, SIREN_BAGS.tone) === undefined)
      ask(vehicle, SIREN_BAGS.tone, 0);
  } else controls.enable("siren");
}

let last: number | false = false;
onCache("seat", () => {
  const before = last;
  last = cache.vehicle;
  if (
    before &&
    settings.value.stopOnDriverExit &&
    DoesEntityExist(before) &&
    level(before, SIREN_BAGS.tone) > 0 &&
    GetPedInVehicleSeat(before, -1) !== cache.ped
  )
    ask(before, SIREN_BAGS.tone, 0);
  update();
});
onCache("vehicle", update);
update();

// The game keeps this switch: set once and again when the panel turns it on (`true` would force fake sirens).
const distantSirens = () =>
  settings.value.disableDistantSirens && DistantCopCarSirens(false);
distantSirens();
world.onChange("settings", distantSirens);
