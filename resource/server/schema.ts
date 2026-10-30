import type { PanelSchema } from "@aicore-fivem/shared";

const SOUND = {
  type: "text" as const,
  min: 1,
  max: 64,
  pattern: "^[A-Z0-9_]+$",
};
const toneSet = {
  type: "object" as const,
  fields: { tone1: SOUND, tone2: SOUND, tone3: SOUND },
};
const MODELS = {
  type: "names" as const,
  max: 40,
  itemMax: 32,
  pattern: "^[a-z0-9_]+$",
};

/** ai-sirens' panel: which vehicles sound how, and the ONX lightbars. */
export const schema: PanelSchema = {
  title: "ADMIN_TITLE",
  icon: "car",
  files: {
    settings: {
      kind: "settings",
      sync: "all",
      sections: {
        disableDistantSirens: { type: "bool" },
        stopOnDriverExit: { type: "bool" },
        fireSirenModels: MODELS,
        powercallModels: MODELS,
        defaultTones: toneSet,
        onxTones: toneSet,
        onxModels: MODELS,
        lightbars: { type: "bool" },
        lightbarMod: { type: "number", min: 0, max: 49, integer: true },
        lightbarModels: {
          type: "list",
          max: 40,
          of: {
            type: "object",
            fields: {
              mod: { type: "number", min: 0, max: 100, integer: true },
              model: { type: "text", min: 1, max: 32, pattern: "^[a-z0-9_]+$" },
            },
          },
        },
      },
      defaults: {
        disableDistantSirens: true,
        stopOnDriverExit: true,
        fireSirenModels: ["firetruk"],
        powercallModels: ["ambulance", "firetruk", "lguard"],
        defaultTones: {
          tone1: "VEHICLES_HORNS_SIREN_1",
          tone2: "VEHICLES_HORNS_SIREN_2",
          tone3: "VEHICLES_HORNS_POLICE_WARNING",
        },
        onxTones: {
          tone1: "RESIDENT_VEHICLES_SIREN_WAIL_02",
          tone2: "RESIDENT_VEHICLES_SIREN_QUICK_02",
          tone3: "VEHICLES_HORNS_POLICE_WARNING",
        },
        onxModels: [],
        lightbars: true,
        lightbarMod: 49,
        lightbarModels: [
          { mod: 4, model: "onx_pol_lbar_mdn1a" },
          { mod: 5, model: "onx_pol_lbar_mdn1b" },
          { mod: 6, model: "onx_pol_lbar_mdn1c" },
          { mod: 7, model: "onx_pol_lbar_mdn2a" },
          { mod: 8, model: "onx_pol_lbar_os1a" },
          { mod: 9, model: "onx_pol_lbar_os2a" },
          { mod: 10, model: "onx_pol_lbar_os2b" },
          { mod: 11, model: "onx_pol_lbar_os3a" },
          { mod: 12, model: "onx_pol_lbar_mdn3a" },
          { mod: 13, model: "onx_pol_lbar_mdn3b" },
          { mod: 14, model: "onx_ems_lbar_mdn1a" },
          { mod: 15, model: "onx_ems_lbar_mdn1b" },
          { mod: 16, model: "onx_ems_lbar_mdn1c" },
          { mod: 17, model: "onx_amb_lbar_mdn1a" },
          { mod: 18, model: "onx_amb_lbar_mdn1b" },
          { mod: 19, model: "onx_amb_lbar_mdn1c" },
        ],
      },
    },
  },
  tabs: [
    {
      id: "sirens",
      file: "settings",
      icon: "car",
      label: "ADMIN_TAB_SIRENS",
      desc: "ADMIN_TAB_SIRENS_DESC",
      cards: [
        {
          icon: "car",
          title: "ADMIN_C_GENERAL",
          desc: "ADMIN_C_GENERAL_DESC",
          fields: [
            {
              widget: "switch",
              path: "disableDistantSirens",
              label: "ADMIN_F_DISTANT",
              hint: "ADMIN_H_DISTANT",
            },
            {
              widget: "switch",
              path: "stopOnDriverExit",
              label: "ADMIN_F_STOP_EXIT",
              hint: "ADMIN_H_STOP_EXIT",
            },
            {
              widget: "tags",
              path: "fireSirenModels",
              label: "ADMIN_F_FIRE_MODELS",
              hint: "ADMIN_H_FIRE_MODELS",
              placeholder: "ADMIN_P_MODEL",
            },
            {
              widget: "tags",
              path: "powercallModels",
              label: "ADMIN_F_POWERCALL",
              hint: "ADMIN_H_POWERCALL",
              placeholder: "ADMIN_P_MODEL",
            },
          ],
        },
        {
          icon: "car",
          title: "ADMIN_C_TONES",
          desc: "ADMIN_C_TONES_DESC",
          fields: [
            {
              widget: "text",
              path: "defaultTones.tone1",
              label: "ADMIN_F_TONE1",
              placeholder: "ADMIN_P_SOUND",
            },
            {
              widget: "text",
              path: "defaultTones.tone2",
              label: "ADMIN_F_TONE2",
              placeholder: "ADMIN_P_SOUND",
            },
            {
              widget: "text",
              path: "defaultTones.tone3",
              label: "ADMIN_F_TONE3",
              placeholder: "ADMIN_P_SOUND",
            },
          ],
        },
      ],
    },
    {
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
    },
  ],
};
