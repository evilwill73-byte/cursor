# Free Self-Hosted AI Stack

Guide to run **AI models**, **multiple agents**, and **image generation** on your own server — **no subscriptions**.

## Docs

| File | Contents |
|------|----------|
| [01-overview.md](./01-overview.md) | Goals, architecture, what is free vs paid |
| [02-local-llms.md](./02-local-llms.md) | Ollama, llama.cpp, vLLM + free models |
| [03-multi-agents.md](./03-multi-agents.md) | OpenHands, Aider, CrewAI, AutoGen, Continue |
| [04-image-generation.md](./04-image-generation.md) | ComfyUI + Stable Diffusion / Flux |
| [05-server-requirements.md](./05-server-requirements.md) | GPU, RAM, disk, OS |
| [06-starter-setup.md](./06-starter-setup.md) | Step-by-step install path |
| [07-limits-and-tips.md](./07-limits-and-tips.md) | Honest limits and practical tips |

## Quick architecture

```
Your server
├── Ollama              → LLMs (chat, code, planning)
├── OpenHands / Aider   → agents that edit/build in project folders
├── ComfyUI             → image generation
└── CrewAI / LangGraph  → optional multi-agent routing
```

## Core idea

- Run open-weight models **locally** (Ollama).
- Let agents **edit, create, and build** inside your project folders.
- Generate images with **ComfyUI** (no Midjourney/subscription APIs).
- Cost after hardware: **$0**.
