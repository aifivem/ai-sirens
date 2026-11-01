import { cache, controls, onCache, TickLoop } from "@aicore-fivem/lib/client";
import { SIREN_BAGS } from "common/sirens";
import { ask, isFireSiren, settings, stateOf } from "../state";
import { driven, keys, level } from "./keys";

/** Horn, radio and cinematic camera keys while driving an emergency vehicle (the siren keys take their place). */
const BLOCKED = [86, 81, 82, 85, 80, 83, 84];

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
