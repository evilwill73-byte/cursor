# Local LLMs (Free)

Run language models on your machine. No API keys required for open weights.

## Runtimes

| Tool | Why use it | Link |
|------|------------|------|
| **Ollama** | Easiest local setup; simple CLI + HTTP API | https://ollama.com |
| **llama.cpp** | Fast, low-level, good for servers | https://github.com/ggerganov/llama.cpp |
| **vLLM** | High throughput if you have a strong GPU | https://github.com/vllm-project/vllm |

**Start with Ollama** unless you already know you need vLLM-scale serving.

## Free models to pull

### Coding

| Model (examples) | Notes |
|------------------|--------|
| `qwen2.5-coder:14b` or `32b` | Strong open coding models |
| `deepseek-coder-v2` | Good for code tasks |
| `codestral` | Coding-focused (if available locally) |

### General / agents

| Model (examples) | Notes |
|------------------|--------|
| `llama3.1:8b` / `70b` | Solid general chat + tools |
| `qwen2.5:14b` / `32b` | Strong all-rounder |
| `mistral-nemo` | Efficient general model |
| `gemma2` | Good smaller/mid options |

### Small / weak hardware

| Model (examples) | Notes |
|------------------|--------|
| `phi3` | Small, usable on limited RAM |
| `qwen2.5:7b` | Decent quality for 7B class |
| `llama3.2:3b` | Very light; limited quality |

## Hardware sizing (rule of thumb)

| Model size | Typical VRAM need |
|------------|-------------------|
| 7B–14B | ~8–16 GB VRAM |
| 32B+ | ~24 GB+ VRAM (or CPU — slow) |

CPU-only works for experiments; agents and coding feel much better with a GPU.

## Ollama quick commands

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

## Next

- [Multi-agents](./03-multi-agents.md)
- [Starter setup](./06-starter-setup.md)
