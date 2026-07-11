# Best Stack For You (Free, No Subscriptions)

Your goals: **multi-project agents**, **code create/edit/build**, **images**, **SEO work**, **$0 subscriptions**.

Your old VPS (4 vCPU / 8 GB / no GPU) is too weak for serious local models + images. Below is the clear winner and the server you should rent.

---

## Short answer

| Option | Verdict for you |
|--------|-----------------|
| **My first stack** (Ollama + Aider/OpenHands + ComfyUI) | Needed for **agents + folders + images** |
| **OmniRoute** | **Best free LLM gateway** (use this instead of weak local models) |
| **FreeLLMAPI** | Good, simpler alternative to OmniRoute |
| **AirLLM** | **Skip** — wrong tool for your goals |

### Winner combo

```
OmniRoute  → free cloud models (code, SEO text, some images)
    +
Aider / OpenHands  → manage /projects folders (create, edit, build)
    +
ComfyUI (optional) → local images if you have a GPU
```

**Do not pick only one of the four.**  
Gateways (OmniRoute/FreeLLMAPI) give you models.  
Agents (Aider/OpenHands) edit your projects.  
You need **both**.

---

## Comparison

| | First suggestion (Ollama+Aider+ComfyUI) | AirLLM | FreeLLMAPI | OmniRoute |
|--|----------------------------------------|--------|------------|-----------|
| What it is | Local models + coding agents + images | Library to run huge models on tiny VRAM | Free-tier API proxy | Bigger free-tier API gateway |
| Edits project folders | **Yes** (Aider/OpenHands) | No | No | No |
| Build / create / code | **Yes** | No | Only if you add an agent | Only if you add an agent |
| SEO content/code | Yes (via agent + model) | Too slow/awkward | Yes (via agent) | **Yes** (via agent) |
| Images | ComfyUI (needs GPU) | No | Some free image providers | **More multimodal / image routes** |
| Needs GPU | Strongly for local images/big models | Yes (designed for GPU) | No | No |
| Works on 8 GB RAM CPU VPS | Weak local models only | Poor fit | **Yes** | **Yes** |
| Fully offline | Yes | Mostly | No (cloud free tiers) | No (cloud free tiers) |
| Subscription required | No | No | No (optional Premium) | No ($0 to start) |
| Best role for you | **Agent + image layer** | Not recommended | Backup gateway | **Primary free model layer** |

### AirLLM — why skip

- It only helps **load big models with low VRAM** (layer-by-layer).
- Inference is **very slow**.
- It is **not** an agent, not a folder manager, not an SEO tool, not an image studio.
- Needs a **GPU** to be useful; on CPU it is a bad experience.
- Does not solve multi-project management.

### FreeLLMAPI vs OmniRoute

Both are free-tier routers. For you:

- Pick **OmniRoute** if you want more providers, compression, coding-tool integrations, and stronger multimodal/image options.
- Pick **FreeLLMAPI** if you want something smaller/simpler.

Either one is fine. **OmniRoute is the better default for your feature list.**

---

## Recommended architecture

```
/projects
  site-a/     ← Aider or OpenHands session
  shop-b/
  blog-c/

Your server
├── OmniRoute (:20128)     → free LLMs for code + SEO + some images
├── Aider / OpenHands      → edit/create/build inside each project folder
├── Ollama (optional)      → local backup model if internet/providers fail
└── ComfyUI (if GPU)       → serious local image generation
```

### Free models / providers to enable first (via OmniRoute)

| Use | Free sources to try |
|-----|---------------------|
| Coding | Groq, Cerebras, OpenRouter free, GitHub Models, Gemini free, Mistral free |
| SEO writing / meta / content | Gemini free, Groq Llama, OpenRouter free |
| Images | Pollinations / other free image routes in OmniRoute; or ComfyUI locally |
| Fallback local | Ollama `qwen2.5-coder:7b` or `14b` (if RAM allows) |

Always follow each provider’s free-tier ToS (personal/experimental use).

---

## Best server config for your goals

You asked to change server config. Rent something closer to this:

### Best value (recommended)

| Spec | Target |
|------|--------|
| CPU | **8 vCPU** |
| RAM | **32 GB** |
| GPU | **NVIDIA 16 GB VRAM** (e.g. T4 / A4000 / RTX 4060 Ti 16GB class) |
| Disk | **200–400 GB NVMe** |
| Transfer | 3 TB+ is fine |

This can run:

- OmniRoute + Aider/OpenHands comfortably
- Local Ollama 14B–32B as backup
- ComfyUI for images

### Budget upgrade (if GPU is expensive)

| Spec | Target |
|------|--------|
| CPU | **6–8 vCPU** |
| RAM | **16–32 GB** |
| GPU | none |
| Disk | **160 GB+ NVMe** |

Then:

- Use **OmniRoute free tiers** for almost all intelligence
- Use **Aider** for project editing
- Use **cloud free image providers** (not heavy local ComfyUI)

### Avoid for your full goal list

| Spec | Why |
|------|-----|
| 4 vCPU / 8 GB / no GPU | OK only for tiny tests; weak for multi-agent + images + SEO sites |
| AirLLM on CPU VPS | Slow and incomplete for your workflow |

---

## What to install (order)

### 1) OmniRoute (free models)

```bash
npm install -g omniroute
omniroute
# dashboard / API usually around http://127.0.0.1:20128
# add free provider keys, enable free-only routes
```

### 2) Project folders

```bash
sudo mkdir -p /projects && sudo chown -R "$USER:$USER" /projects
mkdir -p /projects/site-a /projects/shop-b /projects/blog-c
```

### 3) Aider (multi-project code/SEO editing)

```bash
python3 -m venv /opt/ai/venv
source /opt/ai/venv/bin/activate
pip install -U pip aider-chat

cd /projects/site-a
export OPENAI_API_BASE=http://127.0.0.1:20128/v1
export OPENAI_API_KEY=YOUR_OMNIROUTE_KEY
aider --model openai/auto
```

Example prompts:

- `Create a Next.js landing page with SEO title, meta description, Open Graph tags`
- `Add sitemap.xml and robots.txt`
- `Improve heading structure and add FAQ schema JSON-LD`
- `Create /assets requirements for hero image, then generate copy for alt text`

### 4) OpenHands (optional stronger agent)

Use when you want more autonomous terminal/browser-style work. Point LLM base URL to OmniRoute.

### 5) Images

- **No GPU:** use OmniRoute free image providers / Pollinations-style routes  
- **With GPU:** install ComfyUI and save outputs into `/projects/<name>/public` or `assets/`

### 6) Optional local backup (Ollama)

```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull qwen2.5-coder:14b   # needs enough RAM/VRAM
```

Add Ollama as a custom/local provider behind OmniRoute if supported, or call it directly when free tiers are exhausted.

---

## Skip list

- **AirLLM** — not for agents/projects/SEO/images workflow  
- **Paid Cursor / Copilot / ChatGPT Plus / Midjourney** — against your no-subscription rule  
- Running **only** OmniRoute or **only** FreeLLMAPI — no folder management by itself  
- Running **only** Ollama on 8 GB CPU — too weak for your full goal list  

---

## Final recommendation

1. **Change server** to at least **8 vCPU / 16–32 GB RAM**; add **16 GB NVIDIA GPU** if you care about local images.  
2. Install **OmniRoute** as your free model gateway.  
3. Install **Aider** (and later OpenHands) for multi-folder create/edit/build/SEO.  
4. Add **ComfyUI** only if you have a GPU.  
5. Keep **Ollama** optional as offline backup.  
6. **Ignore AirLLM** for this plan.  
7. Use **FreeLLMAPI** only if OmniRoute feels too heavy — same idea, smaller scope.

This is the best free path for: **multiple projects + code + SEO + images + no subscriptions**.
