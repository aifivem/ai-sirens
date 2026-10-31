import {
  cache,
  drivenVehicle,
  entityFromNetId,
  every,
  type Job,
  onCache,
  onStop,
  requestModel,
} from "@aicore-fivem/lib/client";
import { SIREN_BAGS } from "common/sirens";
import { ask, isEmergency, lightbar, settings, stateOf } from "./state";

/**
 * ONX lightbars: every client spawns its own non-networked lightbar on vehicles in scope from the replicated model
 * name; the vehicle's network owner publishes the model from the tuning mod slot. Nothing spawns on the network.
 */
const attached = new Map<number, { entity: number; model: string }>();
const generation = new Map<number, number>();

export const lightbarOf = (vehicle: number): number => {
  const a = attached.get(vehicle);
  return a && DoesEntityExist(a.entity) ? a.entity : 0;
};

function remove(vehicle: number): void {
  const a = attached.get(vehicle);
  attached.delete(vehicle);
  if (a && DoesEntityExist(a.entity)) DeleteEntity(a.entity);
}

async function spawn(
  vehicle: number,
  model: string,
  gen: number,
): Promise<void> {
  const hash = await requestModel(model).catch(() => 0);
  if (!hash) return;
  if (generation.get(vehicle) !== gen || !DoesEntityExist(vehicle))
    return SetModelAsNoLongerNeeded(hash);
  const [x = 0, y = 0, z = 0] = GetEntityCoords(vehicle, false);
  const entity = CreateVehicle(hash, x, y, z, 0, false, false);
  SetModelAsNoLongerNeeded(hash);
  if (!entity) return;
  AttachEntityToEntity(
    entity,
    vehicle,
    GetEntityBoneIndexByName(vehicle, "misc_1"),
    0,
    0,
    0,
    0,
    0,
    0,
    false,
    false,
    false,
    false,
    0,
    true,
  );
  SetVehicleHasMutedSirens(entity, true);
  SetVehicleSiren(entity, IsVehicleSirenOn(vehicle));
  FreezeEntityPosition(entity, true);
  SetEntityCollision(entity, false, false);
  attached.set(vehicle, { entity, model });
  lightbarJob.set(true);
}

lightbar.onChange((netId, model) => {
  const vehicle = entityFromNetId(netId, 2);
  if (!vehicle) return;
  const gen = (generation.get(vehicle) ?? 0) + 1;
  generation.set(vehicle, gen);
  const current = attached.get(vehicle);
  if (current && current.model === model && DoesEntityExist(current.entity))
    return;
  remove(vehicle);
  if (model && settings.value.lightbars) void spawn(vehicle, model, gen);
});

/** Owner side: the lightbar model follows the tuning mod slot of the emergency vehicle the player drives (its owner). */
function publish(vehicle: number): void {
  const s = settings.value;
  if (!s.lightbars || NetworkGetEntityOwner(vehicle) !== cache.playerId) return;
  const mod = GetVehicleMod(vehicle, s.lightbarMod);
  const expected = mod > 1 ? (s.lightbarModels[mod] ?? null) : null;
  if ((stateOf(vehicle, SIREN_BAGS.lightbar) ?? null) !== expected)
    ask(vehicle, SIREN_BAGS.lightbar, expected);
}

/** Runs only while the player drives a networked emergency vehicle (a tuning change shows within a second). */
let publisher: Job | undefined;
function watchDriven(): void {
  const driven = drivenVehicle();
  const vehicle =
    driven !== false &&
    NetworkGetEntityIsNetworked(driven) &&
    isEmergency(driven)
      ? driven
      : 0;
  publisher?.stop();
  publisher = undefined;
  if (!vehicle) return;
  publish(vehicle);
  publisher = every(1000, () => publish(vehicle), { name: "lightbarPublish" });
}
onCache("vehicle", watchDriven);
onCache("seat", watchDriven);
watchDriven();

// Lights mirror onto the lightbar; lightbars of vehicles that are gone go too.
// Runs only while a lightbar is attached.
const lightbarJob = every(250, function lightbars() {
  for (const [vehicle, a] of attached) {
    if (
      !DoesEntityExist(vehicle) ||
      IsEntityDead(vehicle) ||
      !DoesEntityExist(a.entity)
    ) {
      remove(vehicle);
      generation.delete(vehicle);
    } else if (IsVehicleSirenOn(a.entity) !== IsVehicleSirenOn(vehicle))
      SetVehicleSiren(a.entity, IsVehicleSirenOn(vehicle));
  }
  if (attached.size === 0) lightbarJob.set(false);
});

onStop(() => {
  for (const vehicle of attached.keys()) remove(vehicle);
});
