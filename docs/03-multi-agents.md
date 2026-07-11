# Multi-Agents & Project Management (Free)

Tools that can manage **multiple projects/folders**: create files, edit code, run builds, and coordinate specialist agents — all without paid APIs when pointed at Ollama.

## Best tools for your use case

| Tool | Best for | Link |
|------|----------|------|
| **OpenHands** | Agents that edit files, run terminals, build projects | https://github.com/All-Hands-AI/OpenHands |
| **Aider** | Git-aware coding agent (pair programmer in the terminal) | https://aider.chat |
| **CrewAI** | Multiple specialized agents (planner, coder, reviewer) | https://www.crewai.com |
| **AutoGen / AG2** | Multi-agent conversations and task handoff | https://github.com/microsoft/autogen |
| **Continue** | IDE coding assistant pointed at Ollama | https://continue.dev |
| **LangGraph** | Custom multi-agent workflows you fully control | https://github.com/langchain-ai/langgraph |

## What to start with

For “manage multiple projects/folders, build, create, edit”:

1. **OpenHands + Ollama** — strongest “agent that uses the computer” feel  
2. **Aider + Ollama** — excellent if you live in git + terminal  

Add **CrewAI / LangGraph** later when you want separate roles (planner / coder / image / build).

## How folder / project management works

```
/projects
  /app-a     ← agent workspace A
  /app-b     ← agent workspace B
  /site-c    ← agent workspace C
```

- Give each agent (or each OpenHands/Aider session) a **root folder**.
- Agents can create/edit files, run `npm`/`pip`/`make`, and commit if you allow git.
- Keep secrets and production credentials **outside** agent-writable paths.

## Suggested agent roles (optional)

| Agent | Job |
|-------|-----|
| Planner | Break requirements into tasks |
| Coder | Edit/create source files |
| Builder | Run installs, builds, tests |
| Image | Call ComfyUI for assets |
| Reviewer | Check diffs / suggest fixes |

Implement roles with CrewAI, AutoGen, or LangGraph; keep the LLM backend as Ollama.

## IDE option

Use **Continue** in VS Code / JetBrains and set the model provider to **Ollama**. Good for day-to-day editing; pair with OpenHands/Aider for heavier autonomous work.

## Next

- [Image generation](./04-image-generation.md)
- [Starter setup](./06-starter-setup.md)
