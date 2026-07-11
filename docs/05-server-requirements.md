# Server Requirements

What you need to run free local models and agents comfortably.

## Hardware

| Resource | Minimum (experiments) | Comfortable |
|----------|----------------------|-------------|
| **GPU** | Optional (CPU works, slow) | NVIDIA with CUDA, 8–24GB+ VRAM |
| **System RAM** | 16 GB | 32 GB+ |
| **Disk** | ~50 GB | 100–200 GB+ (models + image checkpoints) |
| **OS** | Linux preferred | Ubuntu Server / similar |

## Why GPU matters

- Coding agents feel usable with a mid-size model on GPU.
- Image generation is painful on CPU.
- Larger models (32B+) need more VRAM or quantized weights.

## Model size vs VRAM (approx.)

| Model class | VRAM (quantized, rough) |
|-------------|-------------------------|
| 3B–7B | 4–8 GB |
| 14B | 8–16 GB |
| 32B+ | 24 GB+ |

Quantized GGUF/Q4–Q5 models (via Ollama) reduce VRAM at some quality cost.

## Network

- Outbound needed once to **download** models and tools.
- After that, you can run fully offline if desired.
- Bind Ollama/ComfyUI to localhost or a private network; do not expose publicly without auth.

## Security basics

- Do not give agents write access to your whole disk.
- Scope each agent to specific project folders.
- Keep `.env`, keys, and production data out of agent workspaces.
- Prefer reverse proxy + auth if you access UIs remotely.

## Next

- [Starter setup](./06-starter-setup.md)
- [Limits and tips](./07-limits-and-tips.md)
