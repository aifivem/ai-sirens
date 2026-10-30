import { isFireSiren, isPowercall, manual, tone, tonesOf } from "./state";

/** Sound ids and the applied level per vehicle handle, for the main siren and the airhorn / manual siren. */
const pools = {
  tone: { ids: new Map<number, number>(), applied: new Map<number, number>() },
  manual: {
    ids: new Map<number, number>(),
    applied: new Map<number, number>(),
  },
};
type Pool = keyof typeof pools;

function stop(pool: Pool, vehicle: number): void {
  const id = pools[pool].ids.get(vehicle);
  if (id === undefined) return;
  StopSound(id);
  ReleaseSoundId(id);
  pools[pool].ids.delete(vehicle);
}

function play(pool: Pool, vehicle: number, sound: string): void {
  const id = GetSoundId();
  pools[pool].ids.set(vehicle, id);
  PlaySoundFromEntity(id, sound, vehicle, "", false, 0);
}

/** The main siren: every client plays it from the vehicle (the game's own wail stays muted, except firetrucks on tone 1). */
function applyTone(vehicle: number, level: number): void {
  if (pools.tone.applied.get(vehicle) === level) return;
  stop("tone", vehicle);
  const tones = tonesOf(vehicle);
  SetVehicleHasMutedSirens(vehicle, true);
  if (level === 1) {
    if (isFireSiren(vehicle)) SetVehicleHasMutedSirens(vehicle, false);
    else
      play(
        "tone",
        vehicle,
        isPowercall(vehicle) ? "VEHICLES_HORNS_AMBULANCE_WARNING" : tones.tone1,
      );
  } else if (level === 2) play("tone", vehicle, tones.tone2);
  else if (level === 3)
    play(
      "tone",
      vehicle,
      isFireSiren(vehicle) ? "VEHICLES_HORNS_AMBULANCE_WARNING" : tones.tone3,
    );
  pools.tone.applied.set(vehicle, level);
}

function applyManual(vehicle: number, level: number): void {
  if (pools.manual.applied.get(vehicle) === level) return;
  stop("manual", vehicle);
  const tones = tonesOf(vehicle);
  if (level === 1)
    play(
      "manual",
      vehicle,
      isFireSiren(vehicle)
        ? "VEHICLES_HORNS_FIRETRUCK_WARNING"
        : "SIRENS_AIRHORN",
    );
  else if (level === 2) play("manual", vehicle, tones.tone1);
  else if (level === 3) play("manual", vehicle, tones.tone2);
  pools.manual.applied.set(vehicle, level);
}

/** Plays a replicated change once the vehicle exists here (the bag can arrive first). */
function onChange(apply: (vehicle: number, level: number) => void) {
  return (netId: number, level: number | undefined) => {
    let tries = 0;
    const timer = setInterval(() => {
      const vehicle = NetworkDoesEntityExistWithNetworkId(netId)
        ? NetToVeh(netId)
        : 0;
      if (vehicle || ++tries > 20) clearInterval(timer);
      if (vehicle && !IsEntityDead(vehicle)) apply(vehicle, level ?? 0);
    }, 100);
  };
}
tone.onChange(onChange(applyTone));
manual.onChange(onChange(applyManual));

// Sounds of vehicles that despawned, died or lost their driver (airhorn) stop.
setInterval(() => {
  for (const pool of ["tone", "manual"] as const)
    for (const vehicle of pools[pool].applied.keys()) {
      const gone =
        !DoesEntityExist(vehicle) ||
        IsEntityDead(vehicle) ||
        (pool === "manual" && IsVehicleSeatFree(vehicle, -1));
      if (!gone) continue;
      stop(pool, vehicle);
      pools[pool].applied.delete(vehicle);
    }
}, 500);
