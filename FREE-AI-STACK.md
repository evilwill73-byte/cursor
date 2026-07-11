# Free Self-Hosted AI Stack (No Subscriptions)

Guide to run **AI models**, **multiple agents**, and **image generation** on your own server — **no subscriptions**.

---

## Table of contents

1. [Overview](#1-overview)
2. [Local LLMs](#2-local-llms-free)
3. [Multi-agents & project management](#3-multi-agents--project-management-free)
4. [Image generation](#4-image-generation-free-local)
5. [Server requirements](#5-server-requirements)
6. [Starter setup](#6-starter-setup-practical-path)
7. [Limits and tips](#7-limits-and-tips)

---

## 1. Overview

### What you want

- AI models on **your server**
- **Multiple agents** that manage multiple projects/folders
- Agents that can **build, create, edit** files
- **Create images** from requirements
- Everything **free** — no subscriptions

### Recommended free stack

| Layer | Tool | Role |
|-------|------|------|
| LLM runtime | **Ollama** (or llama.cpp / vLLM) | Run open models locally |
| Coding / folder agents | **OpenHands** or **Aider** | Edit, create, build in project dirs |
| Multi-agent orchestration | **CrewAI**, **AutoGen/AG2**, or **LangGraph** | Planner / coder / reviewer agents |
| IDE assistant | **Continue** | Point your editor at Ollama |
| Images | **ComfyUI** + SDXL / Flux open weights | Local image generation |

### Architecture

```
Your server
├── Ollama              → LLMs (chat, code, planning)
├── OpenHands / Aider   → agents that edit/build in project folders
├── ComfyUI             → image generation
└── CrewAI / LangGraph  → optional multi-agent routing
```

Each project folder can be a workspace the agent is allowed to touch (build, edit, create files).

### Free vs looks-free-but-isn’t

| Use freely | Avoid if you want zero subscription |
|------------|-------------------------------------|
| Ollama + open weights | ChatGPT / Claude / Gemini APIs |
| Hugging Face open models | Midjourney, paid Flux cloud |
| OpenHands, Aider, ComfyUI | Cursor Pro, GitHub Copilot (paid tiers) |
| Local Stable Diffusion | Most hosted “agent” SaaS |

Open-source tools are free; quality depends on **your hardware**, not a monthly plan.

---

## 2. Local LLMs (Free)

Run language models on your machine. No API keys required for open weights.

### Runtimes

| Tool | Why use it | Link |
|------|------------|------|
| **Ollama** | Easiest local setup; simple CLI + HTTP API | https://ollama.com |
| **llama.cpp** | Fast, low-level, good for servers | https://github.com/ggerganov/llama.cpp |
| **vLLM** | High throughput if you have a strong GPU | https://github.com/vllm-project/vllm |

**Start with Ollama** unless you already know you need vLLM-scale serving.

### Free models to pull

#### Coding

| Model (examples) | Notes |
|------------------|--------|
| `qwen2.5-coder:14b` or `32b` | Strong open coding models |
| `deepseek-coder-v2` | Good for code tasks |
| `codestral` | Coding-focused (if available locally) |

#### General / agents

| Model (examples) | Notes |
|------------------|--------|
| `llama3.1:8b` / `70b` | Solid general chat + tools |
| `qwen2.5:14b` / `32b` | Strong all-rounder |
| `mistral-nemo` | Efficient general model |
| `gemma2` | Good smaller/mid options |

#### Small / weak hardware

| Model (examples) | Notes |
|------------------|--------|
| `phi3` | Small, usable on limited RAM |
| `qwen2.5:7b` | Decent quality for 7B class |
| `llama3.2:3b` | Very light; limited quality |

### Hardware sizing (rule of thumb)

| Model size | Typical VRAM need |
|------------|-------------------|
| 7B–14B | ~8–16 GB VRAM |
| 32B+ | ~24 GB+ VRAM (or CPU — slow) |

CPU-only works for experiments; agents and coding feel much better with a GPU.

### Ollama quick commands

```bash
# Install (Linux) — see https://ollama.com for current install
curl -fsSL https://ollama.com/install.sh | sh

# Pull a coding model
ollama pull qwen2.5-coder:14b

# Run interactively
ollama run qwen2.5-coder:14b

# API is usually at:
# http://localhost:11434
```

Point agents (OpenHands, Aider, Continue, CrewAI) at the Ollama base URL.

---

## 3. Multi-agents & project management (Free)

Tools that can manage **multiple projects/folders**: create files, edit code, run builds, and coordinate specialist agents — all without paid APIs when pointed at Ollama.

### Best tools for your use case

| Tool | Best for | Link |
|------|----------|------|
| **OpenHands** | Agents that edit files, run terminals, build projects | https://github.com/All-Hands-AI/OpenHands |
| **Aider** | Git-aware coding agent (pair programmer in the terminal) | https://aider.chat |
| **CrewAI** | Multiple specialized agents (planner, coder, reviewer) | https://www.crewai.com |
| **AutoGen / AG2** | Multi-agent conversations and task handoff | https://github.com/microsoft/autogen |
| **Continue** | IDE coding assistant pointed at Ollama | https://continue.dev |
| **LangGraph** | Custom multi-agent workflows you fully control | https://github.com/langchain-ai/langgraph |

### What to start with

For “manage multiple projects/folders, build, create, edit”:

1. **OpenHands + Ollama** — strongest “agent that uses the computer” feel  
2. **Aider + Ollama** — excellent if you live in git + terminal  

Add **CrewAI / LangGraph** later when you want separate roles (planner / coder / image / build).

### How folder / project management works

```
/projects
  /app-a     ← agent workspace A
  /app-b     ← agent workspace B
  /site-c    ← agent workspace C
```

- Give each agent (or each OpenHands/Aider session) a **root folder**.
- Agents can create/edit files, run `npm`/`pip`/`make`, and commit if you allow git.
- Keep secrets and production credentials **outside** agent-writable paths.

### Suggested agent roles (optional)

| Agent | Job |
|-------|-----|
| Planner | Break requirements into tasks |
| Coder | Edit/create source files |
| Builder | Run installs, builds, tests |
| Image | Call ComfyUI for assets |
| Reviewer | Check diffs / suggest fixes |

Implement roles with CrewAI, AutoGen, or LangGraph; keep the LLM backend as Ollama.

### IDE option

Use **Continue** in VS Code / JetBrains and set the model provider to **Ollama**. Good for day-to-day editing; pair with OpenHands/Aider for heavier autonomous work.

---

## 4. Image generation (Free, local)

Generate images from requirements on your server — no Midjourney or paid cloud APIs.

### Recommended stack

| Tool | Role | Link |
|------|------|------|
| **ComfyUI** | Best local image workflow + API | https://github.com/comfyanonymous/ComfyUI |
| **Stable Diffusion XL / SD3** | Open image models | Hugging Face |
| **Flux (open weights)** | High-quality open image models where licenses allow | Hugging Face |

Download checkpoints from **Hugging Face**. Run them locally with ComfyUI.

### Why ComfyUI

- Node-based workflows (txt2img, img2img, upscale, etc.)
- Can expose an **API** so your agents call it when a task needs an image
- Fully offline after models are downloaded

### Typical flow with agents

```
Requirement → Planner agent → Image agent → ComfyUI API → save PNG into project folder
```

Example: agent creates `assets/hero.png` inside the project directory after ComfyUI finishes.

### Hardware notes

| Setup | Expectation |
|-------|-------------|
| NVIDIA GPU 8GB+ | Usable SDXL / many Flux variants |
| 12–24GB VRAM | Comfortable higher-res / heavier models |
| CPU only | Possible but very slow |

### Alternatives (also free/local)

- Automatic1111 / Forge WebUI — simpler UI; ComfyUI is usually better for automation
- InvokeAI — another local UI option

---

## 5. Server requirements

### Hardware

| Resource | Minimum (experiments) | Comfortable |
|----------|----------------------|-------------|
| **GPU** | Optional (CPU works, slow) | NVIDIA with CUDA, 8–24GB+ VRAM |
| **System RAM** | 16 GB | 32 GB+ |
| **Disk** | ~50 GB | 100–200 GB+ (models + image checkpoints) |
| **OS** | Linux preferred | Ubuntu Server / similar |

### Why GPU matters

- Coding agents feel usable with a mid-size model on GPU.
- Image generation is painful on CPU.
- Larger models (32B+) need more VRAM or quantized weights.

### Model size vs VRAM (approx.)

| Model class | VRAM (quantized, rough) |
|-------------|-------------------------|
| 3B–7B | 4–8 GB |
| 14B | 8–16 GB |
| 32B+ | 24 GB+ |

Quantized GGUF/Q4–Q5 models (via Ollama) reduce VRAM at some quality cost.

### Network

- Outbound needed once to **download** models and tools.
- After that, you can run fully offline if desired.
- Bind Ollama/ComfyUI to localhost or a private network; do not expose publicly without auth.

### Security basics

- Do not give agents write access to your whole disk.
- Scope each agent to specific project folders.
- Keep `.env`, keys, and production data out of agent workspaces.
- Prefer reverse proxy + auth if you access UIs remotely.

---

## 6. Starter setup (practical path)

Follow this order. Everything below can stay **subscription-free** when using open local models.

### Step 1 — Install Ollama + a coding model

```bash
# Install Ollama (Linux) — check https://ollama.com for the latest method
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model that fits your VRAM
ollama pull qwen2.5-coder:14b
# If VRAM is tight:
# ollama pull qwen2.5-coder:7b

# Verify
ollama run qwen2.5-coder:14b "Write a hello world in Python"
```

API base URL (default): `http://localhost:11434`

### Step 2 — Install a coding / folder agent

#### Option A: Aider (terminal + git)

```bash
# Example install — see https://aider.chat for current docs
pip install aider-chat

# Point at Ollama (example; flags may vary by version)
export OLLAMA_API_BASE=http://127.0.0.1:11434
aider --model ollama/qwen2.5-coder:14b
```

Run Aider inside each project folder you want managed.

#### Option B: OpenHands (stronger autonomous agent)

- Follow: https://github.com/All-Hands-AI/OpenHands
- Configure the LLM provider to **Ollama**
- Open a workspace per project folder

### Step 3 — Install ComfyUI for images

```bash
# Clone and follow ComfyUI README for your GPU
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI
# Install deps per their docs, download SDXL/Flux checkpoints into models/
```

When agents need images, call ComfyUI’s API and save outputs into the project `assets/` folder.

### Step 4 — Optional multi-agent layer

Add later when one agent is not enough:

| Tool | Use |
|------|-----|
| CrewAI | Role-based crew (planner, coder, reviewer) |
| AutoGen / AG2 | Multi-agent chat handoff |
| LangGraph | Custom graphs / workflows |

Keep the LLM endpoint as Ollama so costs stay at $0.

### Step 5 — Optional IDE assistant

Install **Continue** and set provider to Ollama with your coding model.

### Suggested project layout

```
/opt/ai
  ollama/          # or system install
  comfyui/
  openhands/       # or docker compose
/projects
  project-a/
  project-b/
  project-c/
```

Agents only get access under `/projects/<name>`.

### Checklist

- [ ] Ollama installed and model pulled
- [ ] Aider or OpenHands talks to Ollama
- [ ] Can create/edit files in a test project
- [ ] Can run a build command via the agent
- [ ] ComfyUI generates one test image
- [ ] Agent workspaces scoped to project folders only

---

## 7. Limits and tips

### Honest limits of “100% free”

- No cloud API means **quality and speed depend on your GPU**.
- Best open coding/image models still lag the top paid APIs, but for personal multi-project automation this stack is solid and costs **$0** after hardware.
- You maintain updates, models, and disk yourself.
- Large context windows and very complex multi-file refactors are harder on small local models.

### Tips that improve results

1. **Pick the right model size** for your VRAM — a fast 14B often beats a thrashing 70B.
2. **One project folder per agent session** — clearer context, fewer mistakes.
3. **Give clear requirements** — agents do better with concrete file paths and acceptance criteria.
4. **Use git** — Aider/OpenHands work best when you can review diffs and revert.
5. **Quantize when needed** — Q4/Q5 models save VRAM; quality drop is often acceptable.
6. **Separate image jobs** — don’t force the coding model to “draw”; call ComfyUI.
7. **Keep secrets out** — never put API keys or production DB creds in agent-writable trees.
8. **Start simple** — Ollama + Aider/OpenHands first; add CrewAI/LangGraph only when needed.

### Free vs paid reminder

| Free (self-hosted) | Paid (avoid for this goal) |
|--------------------|----------------------------|
| Ollama + open weights | OpenAI / Anthropic / Google APIs |
| OpenHands, Aider, Continue | Cursor Pro, Copilot paid |
| ComfyUI + SD/Flux open weights | Midjourney, most image SaaS |
| CrewAI / AutoGen / LangGraph (self-run) | Hosted agent platforms with seats |

### If you share more details later

Useful to refine exact model picks:

- GPU model and VRAM
- System RAM
- Prefer CLI vs web UI
- Main work: code, docs, images, or all three

Then you can lock exact `ollama pull` model names and ComfyUI checkpoints for your machine.
