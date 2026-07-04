# AIRI — Setup Guide (clone → run)

A copy of [moeru-ai/airi](https://github.com/moeru-ai/airi) with stable **chat** and **voice (TTS)** wired up against the **MiniMax** provider. This file walks through getting a fresh clone running on a new machine with only a MiniMax API key.

---

## 1. Prerequisites

| Tool | Min version | Check |
|------|-------------|-------|
| Node.js | 20+ (24 recommended) | `node --version` |
| pnpm    | 10+ (via Corepack)   | `corepack enable && pnpm --version` |
| Git     | any                  | `git --version` |

On Windows, run everything in **PowerShell 7+** (the helper `.ps1` scripts use `Get-NetTCPConnection` / `Get-CimInstance`).

If you don't have pnpm installed:

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

---

## 2. Clone

```bash
git clone https://github.com/zhaosenlin12-creator/airi.git
cd airi
```

Repository layout you'll touch:

- `apps/stage-web` — Vite + Vue 3 web app (what you run)
- `packages/stage-ui` — shared components / stores / composables
- `start-airi-web.ps1` / `stop-airi-web.ps1` / `open-airi-web.ps1` — local lifecycle scripts (Windows)
- `SETUP.md` — this file

---

## 3. Install dependencies

```bash
pnpm install
```

This pulls every workspace package. First run takes a few minutes.

---

## 4. Configure the MiniMax API key

The key is entered in the **running app's Settings** (not a `.env` file). Two providers are registered, both talk to MiniMax:

| Provider id | Endpoint | When to use |
|-------------|----------|-------------|
| `minimax` (MiniMax)        | `https://api.minimaxi.com/v1`        | China region |
| `minimax-global` (MiniMax Global) | `https://api.minimax.io/v1`   | Global region |

### 4.1 Start the dev server

```bash
pnpm -F @proj-airi/stage-web dev
```

Wait for:

```
  VITE v…  ready in … ms
  ➜  Local:   http://localhost:5173/
```

(or use the helper script on Windows: `start-airi-web.ps1`, then `open-airi-web.ps1` to open an isolated Edge profile.)

### 4.2 Plug in the API key

1. Open `http://localhost:5173/` in your browser.
2. Go to **Settings → Providers**.
3. Find **MiniMax** (or **MiniMax Global**) and click it.
4. Paste your API key (looks like `eyJhbGciOi…`).
5. Click **Save / Validate**. The card turns green when the key is accepted.

> The same key is used for **both** chat (text generation) and **voice (TTS)** — no separate key needed. The TTS provider is auto-registered as `minimax-audio-speech` (model `speech-2.5-hd`) and is configured in **Settings → Voice / Speech**.

### 4.3 Enable TTS (voice output)

1. **Settings → Speech / Voice**.
2. Set **Active provider** = `MiniMax TTS` (or `minimax-audio-speech` in the technical view).
3. Set **Model** = `speech-2.5-hd` (default; do not change unless you know what you're doing).
4. Pick a **Voice** (refresh the list after saving the API key).
5. Set **Pitch / Rate** if you want, then save.

### 4.4 Enable chat

1. **Settings → Models / Chat**.
2. Set **Active provider** = `MiniMax` (or `MiniMax Global`).
3. Set **Active model** to one of the suggested ones (e.g. `MiniMax-M2.7` or `MiniMax-M2.5`).
4. Save. Send a message from the main page to verify.

---

## 5. Verify chat + voice

From the main page:

1. Type a sentence in the chat box → press Enter → you should see a streaming reply.
2. Click the **speaker icon** on a reply (or enable "auto-speak") → the reply should be spoken through your default audio device.
3. If you have a microphone, enable "voice input" and speak — the transcribed text appears in the chat box.

If chat works but TTS does not, re-check step 4.3. If TTS works but chat does not, re-check step 4.4 (most often the model field is empty).

---

## 6. Windows helper scripts (optional)

Three scripts at the repo root, all using `$root = Split-Path -Parent $MyInvocation.MyCommand.Path`, so they work no matter where you clone:

| Script | What it does |
|--------|--------------|
| `start-airi-web.ps1` | Starts `vite --host --port 5183` in a hidden window, waits for `<title>AIRI</title>` on `http://localhost:5183/`, prints log paths. |
| `open-airi-web.ps1`  | Launches a fresh Microsoft Edge with an isolated `--user-data-dir` (`.run/edge-profile`) so cookies/cache don't leak into your normal browser. |
| `stop-airi-web.ps1`  | Kills the vite process(es) on port 5183. |

Typical loop:

```powershell
.\start-airi-web.ps1
.\open-airi-web.ps1
# ... use AIRI ...
.\stop-airi-web.ps1
```

---

## 7. Troubleshooting

- **"Cannot find module '…'"** → run `pnpm install` again at the repo root.
- **Port 5183 / 5173 already in use** → run `stop-airi-web.ps1` or `Get-NetTCPConnection -State Listen -LocalPort 5183` to find the conflicting PID.
- **TTS provider card shows empty title** → your build is stale; run `pnpm -F @proj-airi/stage-web build` and reload.
- **Key validation fails with 401** → wrong region (CN vs Global). Try the other provider (`minimax` ↔ `minimax-global`).
- **Edge won't open via `open-airi-web.ps1`** → install Microsoft Edge or change the script to point at your browser.

---

## 8. Updating later

```bash
git pull
pnpm install      # pick up new workspace deps
pnpm -F @proj-airi/stage-web dev
```

Done. You should have a working AIRI web app with chat + voice on any machine in under 5 minutes after clone.
