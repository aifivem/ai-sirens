# ai-sirens

Emergency vehicle (class 18) lights, three siren tones, airhorn and manual siren, firetruck and ambulance tones, ONX lightbars from a tuning slot; every player near hears and sees them. Converted from TGIANN's tgiann-siren-control. Depends on ai-core (admin panel, keybinds).

## Decisions

- Replicated state is three vehicle state bags (`siren:lx` tone, `siren:manu` airhorn / manual, `siren:lightbar` model, `resource/common/sirens.ts`) written only by the server: the driver (or the network owner for the lightbar) asks with `ai-sirens:setState`. The server accepts only vehicles of the panel's `emergencyModels` (it cannot read a vehicle class; an empty list allows every model), a tone / airhorn above 0 only from the driver, a reset to 0 from a player within 10 m while the driver seat is empty (leaving the car), the lightbar only from the network owner and only a model the panel lists. The asking client reads its own request until the server's value arrives, so per-frame reads settle at once; a request without an answer for 1.5 s counts as refused (`client/state.ts`, keys `vehicle * 4 + slot`).
- Model lists are hash sets rebuilt only on a panel change (`settings` view in `client/state.ts`); nothing builds a Set or a string in the driver's per-frame loop.
- The lightbar model is published by the driver of an emergency vehicle (nearly always its network owner) from a 1 s timer that runs only while driving one; no client walks the vehicle pool. `DistantCopCarSirens(false)` is called once and on a panel change (the game keeps it; `true` would force fake sirens).
- Sounds play on every client from the bags (`client/sounds.ts`); GTA's own wail stays muted except firetrucks on tone 1. Lightbars are local, non-networked vehicles every client attaches itself (`client/lightbar.ts`).
- The driver loop is a `TickLoop` only while driving an emergency vehicle; horn, radio and cinematic camera keys go through lib `controls`. Keys are lib `Keybind`s (lights Q, siren left Alt, tone Y, airhorn E), disabled outside an emergency driver seat.
- Not taken over: the interaction click through outside sound resources (a frontend sound plays instead) and the tgiann-pursuitmode tone sync.

## Contracts

- Bags `siren:lx`, `siren:manu`, `siren:lightbar`; event `ai-sirens:setState`. Client exports `SetLights`, `ToggleLights`, `SetSirenTone`, `ToggleSiren`, `CycleTone`, `GetSirenTone`, `AreLightsOn`, `GetAirManuState`, `GetLightbarModel` (state changes work on the driver's client).

## Entry points

- Server checks `resource/server/requests.ts`, panel `server/schema/`; client keys `resource/client/driver/keys.ts` and driver loop `client/driver/index.ts`, distant sirens switch `client/distantSirens.ts`, sounds `client/sounds.ts`, lightbars `client/lightbar.ts`.
