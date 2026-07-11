# Image Generation (Free, Local)

Generate images from requirements on your server — no Midjourney or paid cloud APIs.

## Recommended stack

| Tool | Role | Link |
|------|------|------|
| **ComfyUI** | Best local image workflow + API | https://github.com/comfyanonymous/ComfyUI |
| **Stable Diffusion XL / SD3** | Open image models | Hugging Face |
| **Flux (open weights)** | High-quality open image models where licenses allow | Hugging Face |

Download checkpoints from **Hugging Face**. Run them locally with ComfyUI.

## Why ComfyUI

- Node-based workflows (txt2img, img2img, upscale, etc.)
- Can expose an **API** so your agents call it when a task needs an image
- Fully offline after models are downloaded

## Typical flow with agents

```
Requirement → Planner agent → Image agent → ComfyUI API → save PNG into project folder
```

Example: agent creates `assets/hero.png` inside the project directory after ComfyUI finishes.

## Hardware notes

| Setup | Expectation |
|-------|-------------|
| NVIDIA GPU 8GB+ | Usable SDXL / many Flux variants |
| 12–24GB VRAM | Comfortable higher-res / heavier models |
| CPU only | Possible but very slow |

## Alternatives (also free/local)

- Automatic1111 / Forge WebUI — simpler UI; ComfyUI is usually better for automation
- InvokeAI — another local UI option

## Next

- [Server requirements](./05-server-requirements.md)
- [Starter setup](./06-starter-setup.md)
