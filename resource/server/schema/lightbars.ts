import type { TabSpec } from "@aicore-fivem/shared";

export const lightbarsTab: TabSpec = {
  id: "lightbars",
  file: "settings",
  icon: "car",
  label: "ADMIN_TAB_LIGHTBARS",
  desc: "ADMIN_TAB_LIGHTBARS_DESC",
  cards: [
    {
      icon: "car",
      title: "ADMIN_C_LIGHTBARS",
      desc: "ADMIN_C_LIGHTBARS_DESC",
      fields: [
        {
          widget: "switch",
          path: "lightbars",
          label: "ADMIN_F_LIGHTBARS",
          hint: "ADMIN_H_LIGHTBARS",
        },
        {
          widget: "number",
          path: "lightbarMod",
          label: "ADMIN_F_LIGHTBAR_MOD",
          hint: "ADMIN_H_LIGHTBAR_MOD",
          min: 0,
          max: 49,
        },
        {
          widget: "tags",
          path: "onxModels",
          label: "ADMIN_F_ONX_MODELS",
          hint: "ADMIN_H_ONX_MODELS",
          placeholder: "ADMIN_P_MODEL",
        },
        {
          widget: "list",
          path: "lightbarModels",
          label: "ADMIN_F_LIGHTBAR_MODELS",
          hint: "ADMIN_H_LIGHTBAR_MODELS",
          addLabel: "ADMIN_ADD_LIGHTBAR",
          newRow: { mod: 20, model: "onx_pol_lbar_mdn1a" },
          rows: [
            {
              widget: "number",
              path: "mod",
              label: "ADMIN_F_MOD_VALUE",
              min: 0,
              max: 100,
            },
            {
              widget: "text",
              path: "model",
              label: "ADMIN_F_LIGHTBAR_MODEL",
              placeholder: "ADMIN_P_LIGHTBAR",
            },
          ],
        },
      ],
    },
    {
      icon: "car",
      title: "ADMIN_C_ONX_TONES",
      desc: "ADMIN_C_ONX_TONES_DESC",
      fields: [
        {
          widget: "text",
          path: "onxTones.tone1",
          label: "ADMIN_F_TONE1",
          placeholder: "ADMIN_P_SOUND",
        },
        {
          widget: "text",
          path: "onxTones.tone2",
          label: "ADMIN_F_TONE2",
          placeholder: "ADMIN_P_SOUND",
        },
        {
          widget: "text",
          path: "onxTones.tone3",
          label: "ADMIN_F_TONE3",
          placeholder: "ADMIN_P_SOUND",
        },
      ],
    },
  ],
};
