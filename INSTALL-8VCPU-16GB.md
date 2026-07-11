# Exact Install Order — 8 vCPU / 16 GB RAM / No GPU

Server: **8 AMD vCPU · 16 GB RAM · 320 GB NVMe · 6 TB transfer · no GPU**

Goal: free multi-project agents for **code + SEO + images (via free APIs)** — no subscriptions.

---

## What you will install

| Order | Tool | Why |
|------|------|-----|
| 1 | System packages | Basics |
| 2 | **OmniRoute** | Free cloud models (main brain) |
| 3 | Free provider keys | Groq / Gemini / OpenRouter / etc. |
| 4 | Project folders | `/projects/...` |
| 5 | **Aider** | Create / edit / build / SEO in each folder |
| 6 | **Ollama** (optional backup) | Local 7B–14B if free tiers fail |
| 7 | Skip ComfyUI / AirLLM | No GPU |

---

## Step 0 — Login and check

```bash
ssh YOUR_USER@YOUR_SERVER_IP

nproc          # expect 8
free -h        # expect ~16 GB
df -h /        # expect ~320 GB disk
```

---

## Step 1 — System packages

```bash
sudo apt update && sudo apt upgrade -y

sudo apt install -y \
  curl wget git ca-certificates \
  build-essential \
  python3 python3-pip python3-venv python3-dev \
  unzip tmux htop

# Node.js 20 (needed for OmniRoute)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

node -v
npm -v
python3 --version
git --version
```

Create dirs:

```bash
sudo mkdir -p /opt/ai /projects
sudo chown -R "$USER:$USER" /opt/ai /projects
```

---

## Step 2 — Install OmniRoute (main free AI gateway)

```bash
sudo npm install -g omniroute

# Start it (keep this terminal open, or use tmux)
tmux new -s omni
omniroute
```

Detach tmux: `Ctrl+B` then `D`  
Reattach later: `tmux attach -t omni`

### Open dashboard

From your laptop (SSH tunnel — safest):

```bash
ssh -L 20128:127.0.0.1:20128 YOUR_USER@YOUR_SERVER_IP
```

Then open: **http://127.0.0.1:20128**

> Do **not** expose OmniRoute to the public internet without auth/firewall.

### In the OmniRoute dashboard

1. Create/login local account if asked  
2. Add **free** provider keys (start with these):
   - **Groq** — https://console.groq.com  
   - **Google AI Studio (Gemini)** — https://aistudio.google.com  
   - **OpenRouter** free models — https://openrouter.ai  
   - Optional: GitHub Models, Mistral, Cerebras, Pollinations  
3. Prefer / enable **free-only** routes  
4. Copy your **OmniRoute API key**

Save key on server:

```bash
mkdir -p ~/.config/ai
nano ~/.config/ai/omni.env
```

Put:

```bash
export OPENAI_API_BASE=http://127.0.0.1:20128/v1
export OPENAI_API_KEY=PASTE_YOUR_OMNIROUTE_KEY_HERE
```

Load it:

```bash
echo 'source ~/.config/ai/omni.env' >> ~/.bashrc
source ~/.config/ai/omni.env
```

### Quick API test

```bash
curl -s http://127.0.0.1:20128/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY" | head

curl -s http://127.0.0.1:20128/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "auto",
    "messages": [{"role":"user","content":"Reply with OK"}]
  }'
```

If model name `auto` fails, pick any free model id shown in `/v1/models`.

---

## Step 3 — Create multiple project folders

```bash
mkdir -p /projects/site-a /projects/shop-b /projects/blog-c

for d in site-a shop-b blog-c; do
  cd /projects/$d
  git init
  git config user.email "you@localhost"
  git config user.name "You"
  echo "# $d" > README.md
  git add README.md
  git commit -m "init"
done
```

---

## Step 4 — Install Aider (project agent)

```bash
python3 -m venv /opt/ai/venv
source /opt/ai/venv/bin/activate
pip install -U pip
pip install aider-chat
aider --version
```

### Alias for daily use

```bash
cat >> ~/.bashrc <<'EOF'
alias ai-env='source /opt/ai/venv/bin/activate'
ai-aider() {
  source /opt/ai/venv/bin/activate
  source ~/.config/ai/omni.env
  # If OmniRoute model ids differ, change the model flag after checking /v1/models
  aider --openai-api-base "$OPENAI_API_BASE" --openai-api-key "$OPENAI_API_KEY" --model openai/auto "$@"
}
EOF
source ~/.bashrc
```

> If `openai/auto` is rejected, run `curl .../v1/models` and use a real free model id, e.g. `--model openai/llama-3.3-70b-versatile` (exact names depend on providers you added).

### Run on a project

```bash
cd /projects/site-a
ai-aider
```

### First test prompts (copy/paste into Aider)

1. Code:
```text
Create a simple Python file app.py with a /health style function print_ok() and a main that prints OK
```

2. SEO page:
```text
Create index.html for a local bakery landing page with:
- proper title and meta description
- Open Graph tags
- one H1, clear H2 sections
- FAQ block
- semantic HTML only, no frameworks
```

3. SEO files:
```text
Add robots.txt and sitemap.xml for https://example.com
```

4. Build-ish check:
```text
Add a tiny package.json with a script "start": "python3 -m http.server 8080" and document how to preview
```

Exit Aider when done (`/exit`).

Repeat for other folders:

```bash
cd /projects/shop-b && ai-aider
cd /projects/blog-c && ai-aider
```

One terminal = one project. Use multiple tmux windows if needed.

---

## Step 5 — Optional local backup (Ollama)

Use only if OmniRoute free tiers are down/limited.

```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull qwen2.5-coder:7b
# If RAM feels fine after testing, you can try:
# ollama pull qwen2.5-coder:14b

ollama run qwen2.5-coder:7b "Say OK"
```

Point Aider at Ollama instead when needed:

```bash
source /opt/ai/venv/bin/activate
export OLLAMA_API_BASE=http://127.0.0.1:11434
cd /projects/site-a
aider --model ollama_chat/qwen2.5-coder:7b
```

On 16 GB RAM: prefer **7b** while OmniRoute/Docker/other apps are running. Try **14b** only if memory is free.

---

## Step 6 — Images (no GPU path)

Skip ComfyUI on this server.

Options:

1. Use OmniRoute dashboard/providers that support **image generation** (e.g. Pollinations-style free routes if enabled).  
2. Or ask Aider to write image prompts + SEO alt text, then generate images elsewhere free and drop files into:

```bash
mkdir -p /projects/site-a/assets
# put hero.png etc here
```

Then tell Aider:

```text
Update index.html to use assets/hero.png with descriptive alt text and lazy loading
```

---

## Step 7 — Optional stronger agent (OpenHands)

Only after Aider works.

- Install from: https://github.com/All-Hands-AI/OpenHands  
- Set LLM base URL to `http://127.0.0.1:20128/v1`  
- Use your OmniRoute key  
- Open workspace = one folder under `/projects/...`

If Docker + OpenHands feels heavy on 16 GB, stay with Aider.

---

## Daily usage

### Start stack

```bash
# OmniRoute
tmux has-session -t omni 2>/dev/null || tmux new -d -s omni omniroute

# Optional Ollama
sudo systemctl start ollama 2>/dev/null || true
```

### Work on a site

```bash
cd /projects/site-a
ai-aider
```

Useful SEO prompts:

```text
Audit this folder for SEO issues and fix title/meta/headings/internal links
Add JSON-LD LocalBusiness schema to index.html
Create blog/post-1.html optimized for keyword "best sourdough near me"
Generate meta descriptions under 155 characters for all HTML pages
```

### Multiple projects at once

```bash
tmux new -s work
# window 1
cd /projects/site-a && ai-aider
# Ctrl+B C  (new window)
cd /projects/blog-c && ai-aider
```

Don’t open too many heavy agents at once on 16 GB.

---

## Pass / fail checklist

- [ ] `nproc` = 8, RAM ~16 GB  
- [ ] OmniRoute opens on tunneled `20128`  
- [ ] Free provider keys added  
- [ ] `/v1/chat/completions` returns OK  
- [ ] `/projects/site-a` exists  
- [ ] Aider creates/edits files there  
- [ ] SEO sample `index.html` + `robots.txt` + `sitemap.xml` created  
- [ ] Second project folder works the same  
- [ ] (Optional) Ollama 7b answers locally  

---

## Do / Don’t on this server

| Do | Don’t |
|----|-------|
| OmniRoute + Aider | AirLLM |
| Free provider keys only | Paid subscriptions |
| One project folder per agent | Give agents access to whole disk |
| Ollama 7b/14b backup | Local 32B/70B models |
| Free image APIs | Heavy ComfyUI without GPU |
| SSH tunnel to dashboard | Public open port with no protection |

---

## Expected result

After these steps you can:

- manage **multiple project folders**
- **create / edit / build** code with Aider
- generate **SEO pages, meta, schema, sitemaps**
- use **stronger free cloud models** via OmniRoute
- keep a **local backup model** with Ollama
- stay on **$0 subscriptions**

This is the correct setup for your **8 vCPU / 16 GB / no GPU** server.
