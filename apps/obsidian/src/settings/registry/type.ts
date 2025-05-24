import type { PluginSettingsV1 } from "../migrations/1";

export type LatestPluginSettings = PluginSettingsV1;

export type StringSettings = ExtractTypedKeys<LatestPluginSettings, string>;
export type OptionalStringSettings = ExtractTypedKeys<
  LatestPluginSettings,
  string | undefined
>;
export type NumberSettings = ExtractTypedKeys<LatestPluginSettings, number>;
export type BooleanSettings = ExtractTypedKeys<LatestPluginSettings, boolean>;

type ExtractTypedKeys<R, T> = Exclude<
  {
    [K in keyof R]: R[K] extends T ? K : never;
  }[keyof R],
  "__VERSION__" | undefined
>;
