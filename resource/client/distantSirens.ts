import { settings, world } from "./state";

// The game keeps this switch: set once and again when the panel turns it on (`true` would force fake sirens).
const distantSirens = () =>
  settings.value.disableDistantSirens && DistantCopCarSirens(false);
distantSirens();
world.onChange("settings", distantSirens);
