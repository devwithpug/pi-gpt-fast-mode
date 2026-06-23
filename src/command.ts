// Parser for `/fast [on|off|toggle|status]`.

export const COMMAND_USAGE = "Usage: /fast [on|off|toggle|status]";

export type FastAction =
  | { kind: "set"; desired: boolean }
  | { kind: "toggle" }
  | { kind: "status" };

export class FastCommandError extends Error {
  constructor(message: string = COMMAND_USAGE) {
    super(message);
    this.name = "FastCommandError";
  }
}

export function parseFastCommand(args: string): FastAction {
  const arg = args.trim().toLowerCase();
  if (arg === "" || arg === "toggle") return { kind: "toggle" };
  if (arg === "on") return { kind: "set", desired: true };
  if (arg === "off") return { kind: "set", desired: false };
  if (arg === "status") return { kind: "status" };
  throw new FastCommandError();
}

export function getCommandCompletions(
  prefix: string,
): { value: string; label: string }[] {
  const p = prefix.trim().toLowerCase();
  return ["on", "off", "toggle", "status"]
    .filter((o) => o.startsWith(p))
    .map((value) => ({ value, label: value }));
}
