# Overview

## What you want

- AI models on **your server**
- **Multiple agents** that manage multiple projects/folders
- Agents that can **build, create, edit** files
- **Create images** from requirements
- Everything **free** — no subscriptions

## Recommended free stack

| Layer | Tool | Role |
|-------|------|------|
| LLM runtime | **Ollama** (or llama.cpp / vLLM) | Run open models locally |
| Coding / folder agents | **OpenHands** or **Aider** | Edit, create, build in project dirs |
| Multi-agent orchestration | **CrewAI**, **AutoGen/AG2**, or **LangGraph** | Planner / coder / reviewer agents |
| IDE assistant | **Continue** | Point your editor at Ollama |
| Images | **ComfyUI** + SDXL / Flux open weights | Local image generation |

## Architecture

```
Your server
├── Ollama          → LLMs (chat, code, planning)
├── OpenHands/Aider → agents that edit/build in project folders
├── ComfyUI         → image generation
└── Optional: CrewAI/LangGraph → route tasks to specialist agents
```

Each project folder can be a workspace the agent is allowed to touch (build, edit, create files).

## Free vs looks-free-but-isn’t

| Use freely | Avoid if you want zero subscription |
|------------|-------------------------------------|
| Ollama + open weights | ChatGPT / Claude / Gemini APIs |
| Hugging Face open models | Midjourney, paid Flux cloud |
| OpenHands, Aider, ComfyUI | Cursor Pro, GitHub Copilot (paid tiers) |
| Local Stable Diffusion | Most hosted “agent” SaaS |

Open-source tools are free; quality depends on **your hardware**, not a monthly plan.

## Next

- [Local LLMs](./02-local-llms.md)
- [Multi-agents](./03-multi-agents.md)
- [Image generation](./04-image-generation.md)
- [Server requirements](./05-server-requirements.md)
- [Starter setup](./06-starter-setup.md)
