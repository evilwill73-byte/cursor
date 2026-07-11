# Starter Setup (Practical Path)

Follow this order. Everything below can stay **subscription-free** when using open local models.

## Step 1 — Install Ollama + a coding model

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

## Step 2 — Install a coding / folder agent

### Option A: Aider (terminal + git)

```bash
# Example install — see https://aider.chat for current docs
pip install aider-chat

# Point at Ollama (example; flags may vary by version)
export OLLAMA_API_BASE=http://127.0.0.1:11434
aider --model ollama/qwen2.5-coder:14b
```

Run Aider inside each project folder you want managed.

### Option B: OpenHands (stronger autonomous agent)

- Follow: https://github.com/All-Hands-AI/OpenHands
- Configure the LLM provider to **Ollama**
- Open a workspace per project folder

## Step 3 — Install ComfyUI for images

```bash
# Clone and follow ComfyUI README for your GPU
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI
# Install deps per their docs, download SDXL/Flux checkpoints into models/
```

When agents need images, call ComfyUI’s API and save outputs into the project `assets/` folder.

## Step 4 — Optional multi-agent layer

Add later when one agent is not enough:

| Tool | Use |
|------|-----|
| CrewAI | Role-based crew (planner, coder, reviewer) |
| AutoGen / AG2 | Multi-agent chat handoff |
| LangGraph | Custom graphs / workflows |

Keep the LLM endpoint as Ollama so costs stay at $0.

## Step 5 — Optional IDE assistant

Install **Continue** and set provider to Ollama with your coding model.

## Suggested project layout

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

## Checklist

- [ ] Ollama installed and model pulled
- [ ] Aider or OpenHands talks to Ollama
- [ ] Can create/edit files in a test project
- [ ] Can run a build command via the agent
- [ ] ComfyUI generates one test image
- [ ] Agent workspaces scoped to project folders only

## Next

- [Limits and tips](./07-limits-and-tips.md)
- [Overview](./01-overview.md)
