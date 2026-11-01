import type { PanelSchema } from "@aicore-fivem/shared";
import { lightbarsTab } from "./lightbars";
import { settingsFile, sirensTab } from "./sirens";

/** ai-sirens' panel: which vehicles sound how, and the ONX lightbars. */
export const schema: PanelSchema = {
  title: "ADMIN_TITLE",
  icon: "car",
  files: {
    settings: settingsFile,
  },
  tabs: [sirensTab, lightbarsTab],
};
