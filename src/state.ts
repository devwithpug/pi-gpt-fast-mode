// Fast Mode state: the "desired" preference vs. the "active" runtime state.
//
// - desired: the user asked for Fast Mode (via /fast, --fast, or persisted config)
// - active:  desired AND the current model is supported -> payloads get patched
//
// Keeping the preference separate from the runtime state means switching to an
// unsupported model temporarily disables injection without losing the choice.

import { isSupportedModel } from "./payload.ts";
import type { FastConfig, ModelRef } from "./types.ts";

export class FastState {
  private desired = false;
  private model: ModelRef | undefined;
  private config: FastConfig;

  constructor(config: FastConfig) {
    this.config = config;
  }

  setConfig(config: FastConfig): void {
    this.config = config;
  }

  setModel(model: ModelRef | undefined): void {
    this.model = model;
  }

  setDesired(desired: boolean): void {
    this.desired = desired;
  }

  toggle(): boolean {
    this.desired = !this.desired;
    return this.desired;
  }

  isDesired(): boolean {
    return this.desired;
  }

  /** Whether the current model can use Fast Mode at all. */
  isModelSupported(): boolean {
    return isSupportedModel(this.model, this.config);
  }

  /** Whether Fast Mode is actually applied to outgoing requests right now. */
  isActive(): boolean {
    return this.desired && this.isModelSupported();
  }

  serviceTier(): string {
    return this.config.serviceTier;
  }
}
