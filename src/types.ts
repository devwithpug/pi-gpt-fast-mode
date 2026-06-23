// Shared constants and types for the OpenAI Fast Mode extension.

/** Package / namespace identifier (status key, config dir name). */
export const PACKAGE_NAME = "openai-fast";

/** Key used for the TUI status / widget entry. */
export const STATUS_KEY = PACKAGE_NAME;

/** CLI flag: `pi --fast`. */
export const FLAG_NAME = "fast";

/** Slash command: `/fast`. */
export const COMMAND_NAME = "fast";

/**
 * Environment variable used to hand off the desired Fast Mode preference to
 * child pi processes (subagents). `1` = desired on, `0` = desired off.
 */
export const HANDOFF_ENV = "PI_OPENAI_FAST_DESIRED";

/** OpenAI service tier requested when Fast Mode is active. */
export const DEFAULT_SERVICE_TIER = "priority";

/** Default `provider/model` keys that may use Fast Mode. */
export const DEFAULT_MODELS = [
  "openai/gpt-5.4",
  "openai/gpt-5.5",
  "openai-codex/gpt-5.4",
  "openai-codex/gpt-5.5",
] as const;

/** How the `fast` indicator is surfaced in the TUI. */
export type IndicatorMode = "status" | "widget" | "off";

export interface FastConfig {
  /** Remember the desired on/off choice between pi runs. */
  persist: boolean;
  /** Saved on/off preference (only honored when `persist` is true). */
  desired: boolean;
  /** OpenAI service tier value injected when active. */
  serviceTier: string;
  /** Exact `provider/model` keys that may use Fast Mode. */
  models: string[];
  /** TUI indicator presentation. */
  indicator: IndicatorMode;
}

/** Minimal model identity used for matching. */
export interface ModelRef {
  provider: string;
  id: string;
}
