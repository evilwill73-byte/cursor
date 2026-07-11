# Limits and Tips

## Honest limits of “100% free”

- No cloud API means **quality and speed depend on your GPU**.
- Best open coding/image models still lag the top paid APIs, but for personal multi-project automation this stack is solid and costs **$0** after hardware.
- You maintain updates, models, and disk yourself.
- Large context windows and very complex multi-file refactors are harder on small local models.

## Tips that improve results

1. **Pick the right model size** for your VRAM — a fast 14B often beats a thrashing 70B.
2. **One project folder per agent session** — clearer context, fewer mistakes.
3. **Give clear requirements** — agents do better with concrete file paths and acceptance criteria.
4. **Use git** — Aider/OpenHands work best when you can review diffs and revert.
5. **Quantize when needed** — Q4/Q5 models save VRAM; quality drop is often acceptable.
6. **Separate image jobs** — don’t force the coding model to “draw”; call ComfyUI.
7. **Keep secrets out** — never put API keys or production DB creds in agent-writable trees.
8. **Start simple** — Ollama + Aider/OpenHands first; add CrewAI/LangGraph only when needed.

## Free vs paid reminder

| Free (self-hosted) | Paid (avoid for this goal) |
|--------------------|----------------------------|
| Ollama + open weights | OpenAI / Anthropic / Google APIs |
| OpenHands, Aider, Continue | Cursor Pro, Copilot paid |
| ComfyUI + SD/Flux open weights | Midjourney, most image SaaS |
| CrewAI / AutoGen / LangGraph (self-run) | Hosted agent platforms with seats |

## If you share more details later

Useful to refine exact model picks:

- GPU model and VRAM
- System RAM
- Prefer CLI vs web UI
- Main work: code, docs, images, or all three

Then you can lock exact `ollama pull` model names and ComfyUI checkpoints for your machine.
