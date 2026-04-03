# Claude Code — nestjs-agent

This file is **project memory** for [Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview). It is loaded automatically when you run `claude` from this repo (or a subdirectory with its own `CLAUDE.md`). More specific `CLAUDE.md` files in subfolders layer on top of this one.

## Authoritative docs in this repo

1. **[`AGENTS.md`](AGENTS.md)** — NestJS boundaries, pnpm-only, Prisma rules, safe zones.
2. **[`docs/PROJECT.md`](docs/PROJECT.md)** — scripts, stack table, CLI commands (kept in sync with `package.json`).

Follow those before inventing commands or folder layouts.

## Stack (short)

- **NestJS** API, **pnpm** only, **PostgreSQL** + **Prisma**, **Redis** where configured.
- Validation: `class-validator` / `class-transformer`; config via `@nestjs/config` + validated env.

## How to work in this project (CLI-first)

Prefer driving work from the terminal with the **`claude`** CLI.

### Session basics

| Goal | Command |
|------|---------|
| Interactive coding session (default) | `claude` |
| One-shot answer / scriptable output | `claude -p "your prompt"` |
| Continue last conversation in this directory | `claude -c` or `claude --continue` |
| Resume by id or picker | `claude --resume` |
| Named session (title / `/resume`) | `claude -n "feature-x"` |
| JSON output (automation) | `claude -p "..." --output-format json` |
| Pick model | `claude --model sonnet` (or full model id) |

### Health and configuration

| Goal | Command |
|------|---------|
| Updater / environment check | `claude doctor` *(use a real terminal with TTY; may fail in piped/non-interactive environments)* |
| List MCP servers | `claude mcp list` |
| Add project MCP (example) | `claude mcp add <name> -- <command> [args...]` |
| List agents | `claude agents` |
| Auth | `claude auth` |

### Settings scopes

- **Project (shared):** `.claude/settings.json`
- **Local (you, gitignored):** `.claude/settings.local.json`
- **User (all repos):** `~/.claude/settings.json`

Override for one session: CLI flags (see `claude --help`).

### Verification after changes

Run from repo root:

```bash
pnpm run check:ci
pnpm run lint
pnpm run test
```

Use `pnpm run build` before treating a change as done when it touches compilation.

### Context and safety

- **Plan before big edits:** use Plan permission mode when exploring (`claude --permission-mode plan`) or separate research from implementation in your prompts.
- **Do not** edit `prisma/migrations/**` SQL by hand; add migrations via Prisma CLI (`pnpm exec prisma migrate dev`).
- **Secrets:** do not read or echo `.env`; new variables go through the config module (see `AGENTS.md`).

## When unsure

Re-read `AGENTS.md` and `docs/PROJECT.md`, then grep the codebase for existing patterns before adding new modules or dependencies.
