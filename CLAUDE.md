# ai-sirens

Emergency vehicle (class 18) lights, three siren tones, airhorn and manual siren, firetruck and ambulance tones, ONX lightbars from a tuning slot; every player near hears and sees them. Converted from TGIANN's tgiann-siren-control. Depends on ai-core (admin panel, keybinds).

## Decisions

- Replicated state is three vehicle state bags (`siren:lx` tone, `siren:manu` airhorn / manual, `siren:lightbar` model, `resource/common/sirens.ts`) written only by the server: the driver (or the network owner for the lightbar) asks with `ai-sirens:setState`, the server checks driver / owner and the panel's lightbar list. The asking client reads its own request until the server's value arrives, so per-frame reads settle at once (`client/state.ts`).
- Sounds play on every client from the bags (`client/sounds.ts`); GTA's own wail stays muted except firetrucks on tone 1. Lightbars are local, non-networked vehicles every client attaches itself (`client/lightbar.ts`).
- The driver loop is a `TickLoop` only while driving an emergency vehicle; horn, radio and cinematic camera keys go through lib `controls`. Keys are lib `Keybind`s (lights Q, siren left Alt, tone Y, airhorn E), disabled outside an emergency driver seat.
- Not taken over: the interaction click through outside sound resources (a frontend sound plays instead) and the tgiann-pursuitmode tone sync.

## Contracts

- Bags `siren:lx`, `siren:manu`, `siren:lightbar`; event `ai-sirens:setState`. Client exports `SetLights`, `ToggleLights`, `SetSirenTone`, `ToggleSiren`, `CycleTone`, `GetSirenTone`, `AreLightsOn`, `GetAirManuState`, `GetLightbarModel` (state changes work on the driver's client).

## Entry points

- Server checks `resource/server/index.ts`, panel `server/schema.ts`; client keys and driver loop `resource/client/index.ts`, sounds `client/sounds.ts`, lightbars `client/lightbar.ts`.
