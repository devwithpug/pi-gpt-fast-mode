# pi-openai-fastmode

A [pi](https://pi.dev) extension that turns on **OpenAI Fast Mode** from inside pi.

When Fast Mode is active, the extension asks OpenAI for the `priority` service
tier on supported GPT-5.4 / GPT-5.5 models, shows a `fast` indicator in the TUI,
and hands the preference off to subagents automatically.

## Install

```bash
pi install git:github.com/devwithpug/pi-openai-fastmode
```

Or try it for a single run without installing:

```bash
pi -e git:github.com/devwithpug/pi-openai-fastmode
```

## Usage

Inside pi:

```text
/fast          # toggle Fast Mode
/fast on       # enable
/fast off      # disable
/fast toggle   # toggle
/fast status   # report current state
```

Start pi with Fast Mode already requested:

```bash
pi --fast
```

## How it behaves

Fast Mode distinguishes between what you **want** and what is **applied**:

- **desired** — you asked for Fast Mode (`/fast`, `--fast`, or persisted config)
- **active** — desired **and** the current model is supported → requests get
  `service_tier: "priority"`

Switching to an unsupported model temporarily stops the priority request without
losing your preference. Switch back to a GPT-5.4/5.5 model and it resumes.

## Subagents

Turn on `/fast` once in your parent pi session, then launch subagents as usual.
The preference is exported as the `PI_OPENAI_FAST_DESIRED` environment variable
(`1` / `0`), which child pi processes inherit on startup. A subagent only sends
priority requests when it is also on a supported model.

To verify, ask a subagent to print `PI_OPENAI_FAST_DESIRED`; `1` means the
preference was handed off.

## Supported models

By default:

```json
[
  "openai/gpt-5.4",
  "openai/gpt-5.5",
  "openai-codex/gpt-5.4",
  "openai-codex/gpt-5.5"
]
```

Model keys must match pi's exact `provider/model` key.

## Configuration

Config files are resolved in this order (first that exists wins):

1. Project: `.pi/extensions/openai-fast.json`
2. User: `~/.pi/agent/extensions/openai-fast/config.json`

```json
{
  "persist": false,
  "desired": false,
  "serviceTier": "priority",
  "models": [
    "openai/gpt-5.4",
    "openai/gpt-5.5",
    "openai-codex/gpt-5.4",
    "openai-codex/gpt-5.5"
  ],
  "indicator": "status"
}
```

| Field | Default | Meaning |
|-------|---------|---------|
| `persist` | `false` | Remember the on/off choice between pi runs. |
| `desired` | `false` | Saved preference (only honored when `persist` is `true`). |
| `serviceTier` | `"priority"` | OpenAI service tier value injected when active. |
| `models` | see above | Exact `provider/model` keys allowed to use Fast Mode. |
| `indicator` | `"status"` | TUI feedback: `status`, `widget`, or `off`. |

Fast Mode starts **disabled** and **session-only** by default. Set
`"persist": true` if you want your `/fast` choice remembered between runs.

## Troubleshooting

**I turned Fast Mode on but I don't see `fast`.**
Check that your current model is in `models`, and that `indicator` is not `off`.

**My `/fast` choice isn't remembered after restart.**
Set `"persist": true` in your config.

**Does this guarantee faster responses?**
No. It requests OpenAI's priority service tier when possible. Actual latency,
availability, and billing depend on OpenAI and your account.

## Development

```bash
npm install
npm run check   # typecheck + tests
```

## License

MIT © devwithpug

Inspired by [pi-openai-fast-mode](https://github.com/johncmunson/pi-openai-fast-mode)
and [pi-openai-fast](https://github.com/studioarray/pi-openai-fast).
