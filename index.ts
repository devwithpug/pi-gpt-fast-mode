// OpenAI Fast Mode for pi
// ------------------------
// Requests OpenAI's `priority` service tier for supported GPT-5.4 / GPT-5.5
// models. Toggle with `/fast`, start with `--fast`, and the preference is
// handed off to subagents automatically.

import type {
  ExtensionAPI,
  ExtensionCommandContext,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import {
  COMMAND_USAGE,
  FastCommandError,
  getCommandCompletions,
  parseFastCommand,
} from "./src/command.ts";
import {
  cloneConfig,
  loadConfig,
  saveConfig,
  type LoadedConfig,
} from "./src/config.ts";
import { readHandoff, writeHandoff } from "./src/handoff.ts";
import { injectServiceTier } from "./src/payload.ts";
import { FastState } from "./src/state.ts";
import { clearIndicator, updateIndicator } from "./src/status.ts";
import {
  COMMAND_NAME,
  FLAG_NAME,
  type FastConfig,
  type ModelRef,
} from "./src/types.ts";
import { toModelRef } from "./src/payload.ts";

export default function openaiFastExtension(pi: ExtensionAPI): void {
  let loaded: LoadedConfig | undefined;
  let config: FastConfig = cloneConfig();
  const state = new FastState(config);

  function notifyError(ctx: ExtensionContext, error: unknown): void {
    if (!ctx.hasUI) return;
    ctx.ui.notify(
      error instanceof Error ? error.message : String(error),
      "error",
    );
  }

  function currentModel(ctx: { model?: unknown }): ModelRef | undefined {
    return toModelRef(ctx.model);
  }

  function refreshIndicator(ctx: ExtensionContext): void {
    updateIndicator(ctx, config.models.length ? config.indicator : "off", state.isActive());
  }

  async function persistIfEnabled(): Promise<void> {
    if (!loaded || !config.persist) return;
    await saveConfig(loaded.path, { ...config, desired: state.isDesired() });
  }

  pi.registerFlag(FLAG_NAME, {
    description: "Start with OpenAI Fast Mode (priority tier) enabled",
    type: "boolean",
    default: false,
  });

  pi.registerCommand(COMMAND_NAME, {
    description: "Toggle OpenAI Fast Mode. " + COMMAND_USAGE,
    getArgumentCompletions: getCommandCompletions,
    handler: async (args: string, ctx: ExtensionCommandContext) => {
      try {
        const action = parseFastCommand(args);
        state.setModel(currentModel(ctx));

        if (action.kind === "status") {
          reportStatus(ctx);
          return;
        }

        if (action.kind === "toggle") state.toggle();
        else state.setDesired(action.desired);

        writeHandoff(state.isDesired());
        await persistIfEnabled();
        refreshIndicator(ctx);
        announce(ctx);
      } catch (error) {
        if (error instanceof FastCommandError) {
          ctx.ui.notify(error.message, "warning");
        } else {
          notifyError(ctx, error);
        }
      }
    },
  });

  function reportStatus(ctx: ExtensionContext): void {
    const desired = state.isDesired();
    const supported = state.isModelSupported();
    const model = currentModel(ctx);
    const where = model ? `${model.provider}/${model.id}` : "unknown model";
    let msg: string;
    if (!desired) msg = "Fast Mode is OFF";
    else if (state.isActive())
      msg = `Fast Mode is ON \u2014 requesting "${state.serviceTier()}" on ${where}`;
    else
      msg = `Fast Mode is ON but ${where} is not supported; priority not requested`;
    ctx.ui.notify(msg, supported || !desired ? "info" : "warning");
  }

  function announce(ctx: ExtensionContext): void {
    if (!ctx.hasUI) return;
    if (!state.isDesired()) {
      ctx.ui.notify("Fast Mode disabled", "info");
      return;
    }
    if (state.isActive()) {
      ctx.ui.notify(`Fast Mode enabled (${state.serviceTier()})`, "info");
    } else {
      ctx.ui.notify(
        "Fast Mode enabled, but current model is unsupported \u2014 switch to a GPT-5.4/5.5 model to use it",
        "warning",
      );
    }
  }

  pi.on("session_start", async (_event, ctx) => {
    try {
      loaded = await loadConfig(ctx.cwd);
      config = loaded.config;
      state.setConfig(config);
      state.setModel(currentModel(ctx));

      // Resolve the desired preference at startup, in priority order:
      //   1. --fast flag
      //   2. inherited subagent hand-off (PI_OPENAI_FAST_DESIRED)
      //   3. persisted preference (only when persist is enabled)
      const flag = pi.getFlag(FLAG_NAME) === true;
      const handoff = readHandoff();
      let desired = false;
      if (flag) desired = true;
      else if (handoff !== undefined) desired = handoff;
      else if (config.persist) desired = config.desired;

      state.setDesired(desired);
      writeHandoff(desired);
      await persistIfEnabled();
      refreshIndicator(ctx);
    } catch (error) {
      notifyError(ctx, error);
    }
  });

  pi.on("model_select", async (event, ctx) => {
    state.setModel(toModelRef(event.model) ?? currentModel(ctx));
    refreshIndicator(ctx);
  });

  pi.on("before_provider_request", (event, ctx) => {
    state.setModel(currentModel(ctx) ?? undefined);
    if (!state.isActive()) return undefined;
    const next = injectServiceTier(event.payload, state.serviceTier());
    return next === event.payload ? undefined : next;
  });

  pi.on("session_shutdown", async (_event, ctx) => {
    try {
      await persistIfEnabled();
    } catch (error) {
      notifyError(ctx, error);
    } finally {
      clearIndicator(ctx);
    }
  });
}
