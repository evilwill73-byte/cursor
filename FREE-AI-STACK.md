# Free Self-Hosted AI Stack — Full Server Setup

Complete setup process for a **test server**. No subscriptions. Uses open-source tools only.

**Assumes:** Ubuntu 22.04/24.04 (or similar Linux), you have `sudo`, and you can SSH in.

---

## Table of contents

1. [What you will install](#1-what-you-will-install)
2. [Check your server](#2-check-your-server)
3. [Prepare the system](#3-prepare-the-system)
4. [Install Ollama (LLM)](#4-install-ollama-llm)
5. [Pull free models](#5-pull-free-models)
6. [Create project folders](#6-create-project-folders)
7. [Install Aider (coding agent)](#7-install-aider-coding-agent)
8. [Install OpenHands (optional stronger agent)](#8-install-openhands-optional-stronger-agent)
9. [Install ComfyUI (images)](#9-install-comfyui-images)
10. [Optional: CrewAI multi-agents](#10-optional-crewai-multi-agents)
11. [Test everything](#11-test-everything)
12. [Daily usage](#12-daily-usage)
13. [Troubleshooting](#13-troubleshooting)
14. [Model & hardware cheat sheet](#14-model--hardware-cheat-sheet)

---

## 1. What you will install

| Step | Tool | Purpose |
|------|------|---------|
| 1 | System packages | Python, git, build tools |
| 2 | **Ollama** | Run free local AI models |
| 3 | Coding model | e.g. `qwen2.5-coder` |
| 4 | **Aider** | Agent that edits/creates code in folders |
| 5 | **OpenHands** (optional) | Stronger autonomous agent |
| 6 | **ComfyUI** (optional) | Free local image generation |
| 7 | **CrewAI** (optional) | Multiple specialist agents |

Final layout:

```
/opt/ai
  comfyui/           # image generation
  openhands/         # optional agent
  venv/              # Python tools (aider, crewai)
/projects
  demo-a/            # test project 1
  demo-b/            # test project 2
```

---

## 2. Check your server

SSH into your server, then run:

```bash
# OS
cat /etc/os-release | head -5

# CPU / RAM
nproc
free -h

# Disk
df -h /

# GPU (NVIDIA)?
nvidia-smi || echo "No NVIDIA GPU detected — CPU mode (slower) is OK for testing"
```

### What you need for testing

| Resource | Minimum for test | Better |
|----------|------------------|--------|
| RAM | 8–16 GB | 32 GB+ |
| Disk free | 30 GB | 100 GB+ |
| GPU | Optional | NVIDIA 8GB+ VRAM |
| OS | Ubuntu 22.04+ | Ubuntu 24.04 |

**No GPU?** Still fine for testing small models (`7b` / `3b`). Expect slower replies.

---

## 3. Prepare the system

```bash
sudo apt update
sudo apt upgrade -y

sudo apt install -y \
  curl wget git ca-certificates \
  build-essential \
  python3 python3-pip python3-venv python3-dev \
  unzip tmux htop

# Optional: Node.js (useful if agents build JS projects)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Confirm
python3 --version
git --version
node --version || true
```

Create directories:

```bash
sudo mkdir -p /opt/ai /projects
sudo chown -R "$USER:$USER" /opt/ai /projects
```

---

## 4. Install Ollama (LLM)

```bash
curl -fsSL https://ollama.com/install.sh | sh

# Check service
ollama --version
systemctl is-active ollama || sudo systemctl enable --now ollama

# API should answer
curl -s http://127.0.0.1:11434/api/tags
```

### Allow LAN access (optional — only on private/test networks)

By default Ollama listens on localhost. To reach it from another machine on your LAN:

```bash
sudo mkdir -p /etc/systemd/system/ollama.service.d
sudo tee /etc/systemd/system/ollama.service.d/override.conf >/dev/null <<'EOF'
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
EOF

sudo systemctl daemon-reload
sudo systemctl restart ollama
```

**Security:** do not expose port `11434` to the public internet without a firewall/auth.

---

## 5. Pull free models

Pick **one** coding model based on RAM/VRAM:

```bash
# Weak server / CPU / ~8GB RAM  → small
ollama pull qwen2.5-coder:7b

# Normal test server / ~16GB RAM or 8–12GB VRAM → recommended
ollama pull qwen2.5-coder:14b

# Strong GPU (24GB+ VRAM)
# ollama pull qwen2.5-coder:32b

# Optional general chat model
ollama pull llama3.1:8b
```

List and quick test:

```bash
ollama list

# Interactive test
ollama run qwen2.5-coder:7b "Write a Python hello world function"

# Or use the model you actually pulled, e.g.:
# ollama run qwen2.5-coder:14b "Write a Python hello world function"
```

Set a default model name for later scripts (edit to match what you pulled):

```bash
echo 'export AI_MODEL=qwen2.5-coder:7b' >> ~/.bashrc
# If you pulled 14b instead:
# echo 'export AI_MODEL=qwen2.5-coder:14b' >> ~/.bashrc
source ~/.bashrc
echo "Using model: $AI_MODEL"
```

---

## 6. Create project folders

```bash
mkdir -p /projects/demo-a /projects/demo-b
cd /projects/demo-a
git init
echo "# Demo A" > README.md
git add README.md
git config user.email "test@localhost"
git config user.name "Test User"
git commit -m "init"

cd /projects/demo-b
git init
echo "# Demo B" > README.md
git add README.md
git config user.email "test@localhost"
git config user.name "Test User"
git commit -m "init"
```

Agents will work **inside** these folders.

---

## 7. Install Aider (coding agent)

Aider is the fastest way to get a free coding agent talking to Ollama.

```bash
python3 -m venv /opt/ai/venv
source /opt/ai/venv/bin/activate
pip install -U pip
pip install aider-chat

aider --version
```

### Run Aider on a project

```bash
source /opt/ai/venv/bin/activate
export OLLAMA_API_BASE=http://127.0.0.1:11434

cd /projects/demo-a
aider --model "ollama_chat/${AI_MODEL:-qwen2.5-coder:7b}"
```

Inside Aider, try:

```
Create a file hello.py that prints Hello from Demo A
```

Then exit (`/exit` or Ctrl+C), and check:

```bash
ls -la /projects/demo-a
cat /projects/demo-a/hello.py
```

### Handy alias

```bash
cat >> ~/.bashrc <<'EOF'
alias ai-env='source /opt/ai/venv/bin/activate'
alias ai-aider='source /opt/ai/venv/bin/activate; export OLLAMA_API_BASE=http://127.0.0.1:11434; aider --model ollama_chat/${AI_MODEL:-qwen2.5-coder:7b}'
EOF
source ~/.bashrc
```

Usage:

```bash
cd /projects/demo-a
ai-aider
```

---

## 8. Install OpenHands (optional stronger agent)

Use this if you want an agent that can use a browser-like workspace, terminal, and file editor more autonomously.

### Option A — Docker (recommended if Docker is available)

```bash
# Install Docker if missing
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER"
  echo "Log out and back in (or run: newgrp docker), then re-run the OpenHands steps."
fi

docker --version
```

Follow the current OpenHands docs (commands change over time):

- Repo: https://github.com/All-Hands-AI/OpenHands  
- Configure LLM provider = **Ollama**  
- Base URL = `http://host.docker.internal:11434` (Docker Desktop)  
  or `http://172.17.0.1:11434` / your server LAN IP (Linux Docker)  
- Model = the same name you pulled, e.g. `qwen2.5-coder:7b`  
- Mount/open workspace = `/projects/demo-a`

Example pattern (check docs for the latest `docker run` / compose):

```bash
# Example only — verify against OpenHands README before running
export OH_DIR=/opt/ai/openhands
mkdir -p "$OH_DIR"
cd "$OH_DIR"
# Place their docker-compose.yml / follow official quickstart
```

### Option B — skip for now

If Docker is painful on your test box, **Aider + Ollama is enough** to validate the whole idea.

---

## 9. Install ComfyUI (images)

Skip if you only need code agents for this test.

```bash
cd /opt/ai
git clone https://github.com/comfyanonymous/ComfyUI.git
cd /opt/ai/ComfyUI

python3 -m venv .venv
source .venv/bin/activate
pip install -U pip
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
# If you have NVIDIA CUDA, use the CUDA wheel from https://pytorch.org instead of cpu

pip install -r requirements.txt
```

### Download one free image model (example: SDXL turbo / small checkpoint)

Pick a small checkpoint for testing so download is not huge. Example using a common SD 1.5-class model (adjust URL to a model you trust from Hugging Face):

```bash
mkdir -p /opt/ai/ComfyUI/models/checkpoints
cd /opt/ai/ComfyUI/models/checkpoints

# Example: download a public SD checkpoint from Hugging Face
# Replace with the exact model file you choose on huggingface.co
# wget -O model.safetensors "https://huggingface.co/.../model.safetensors"

echo "Put at least one .safetensors/.ckpt file in:"
pwd
```

### Start ComfyUI

```bash
cd /opt/ai/ComfyUI
source .venv/bin/activate

# Local only
python main.py --listen 127.0.0.1 --port 8188

# Or LAN test access (private network only)
# python main.py --listen 0.0.0.0 --port 8188
```

Open in browser: `http://SERVER_IP:8188` (if listening on LAN) or SSH tunnel:

```bash
# From your laptop
ssh -L 8188:127.0.0.1:8188 user@YOUR_SERVER_IP
# Then open http://127.0.0.1:8188
```

Save generated images into a project folder, e.g. `/projects/demo-a/assets/`.

### Run ComfyUI in background with tmux

```bash
tmux new -s comfy
cd /opt/ai/ComfyUI && source .venv/bin/activate && python main.py --listen 127.0.0.1 --port 8188
# Detach: Ctrl+B then D
# Reattach later: tmux attach -t comfy
```

---

## 10. Optional: CrewAI multi-agents

For multiple specialist agents (planner / coder) on top of Ollama:

```bash
source /opt/ai/venv/bin/activate
pip install crewai crewai-tools langchain-ollama
```

Create a tiny test script:

```bash
mkdir -p /opt/ai/crew-demo
cat > /opt/ai/crew-demo/run_crew.py <<'PY'
import os
from crewai import Agent, Task, Crew, LLM

model = os.environ.get("AI_MODEL", "qwen2.5-coder:7b")
llm = LLM(model=f"ollama/{model}", base_url="http://127.0.0.1:11434")

planner = Agent(
    role="Planner",
    goal="Break the user request into clear coding steps",
    backstory="You plan software tasks clearly and briefly.",
    llm=llm,
    verbose=True,
)

coder = Agent(
    role="Coder",
    goal="Write simple Python code for the plan",
    backstory="You write short, working Python scripts.",
    llm=llm,
    verbose=True,
)

task1 = Task(
    description="Plan a tiny Python script that prints the numbers 1 to 5.",
    expected_output="A short step list.",
    agent=planner,
)

task2 = Task(
    description="Write the Python script based on the plan. Output only the code.",
    expected_output="A complete Python script.",
    agent=coder,
)

crew = Crew(agents=[planner, coder], tasks=[task1, task2])
result = crew.kickoff()
print("\n=== RESULT ===\n", result)
PY
```

Run:

```bash
source /opt/ai/venv/bin/activate
export AI_MODEL="${AI_MODEL:-qwen2.5-coder:7b}"
cd /opt/ai/crew-demo
python run_crew.py
```

> Note: CrewAI versions change often. If import errors appear, check their latest docs and adjust package versions.

---

## 11. Test everything

Run these checks on the server:

### A) Ollama works

```bash
curl -s http://127.0.0.1:11434/api/tags | head
ollama run "${AI_MODEL:-qwen2.5-coder:7b}" "Reply with OK"
```

### B) Aider can create/edit files

```bash
source /opt/ai/venv/bin/activate
export OLLAMA_API_BASE=http://127.0.0.1:11434
cd /projects/demo-a
aider --model "ollama_chat/${AI_MODEL:-qwen2.5-coder:7b}"
# Ask: Create app.py with a function add(a,b) and a main that prints add(2,3)
```

Then:

```bash
python3 /projects/demo-a/app.py
```

### C) Second project folder

```bash
cd /projects/demo-b
ai-aider
# Ask: Create main.py that prints Demo B ready
```

### D) Image (if ComfyUI installed)

- Open UI via SSH tunnel
- Generate one image
- Copy it to `/projects/demo-a/assets/`

### Pass criteria for your test server

- [ ] `ollama list` shows at least one model  
- [ ] Model answers a prompt  
- [ ] Aider creates a file in `/projects/demo-a`  
- [ ] Same works in `/projects/demo-b`  
- [ ] (Optional) ComfyUI loads and generates one image  
- [ ] (Optional) CrewAI script prints a result  

---

## 12. Daily usage

### Start / check Ollama

```bash
sudo systemctl status ollama
# if stopped:
sudo systemctl start ollama
```

### Work on a project with Aider

```bash
cd /projects/YOUR_PROJECT
ai-aider
```

Example prompts:

- `Create a FastAPI app with /health endpoint`
- `Add a Dockerfile for this project`
- `Fix the bug in main.py that causes KeyError`
- `Create assets/ folder and a script that documents image requirements`

### Manage multiple projects

```bash
/projects
  shop-api/     → cd here + ai-aider
  landing/      → cd here + ai-aider
  admin-panel/  → cd here + ai-aider
```

One agent session = one project folder. Open another terminal/tmux window for another project.

### Keep long jobs alive with tmux

```bash
tmux new -s ai
# run aider / comfy / crew here
# Ctrl+B then D to detach
tmux ls
tmux attach -t ai
```

---

## 13. Troubleshooting

| Problem | Fix |
|---------|-----|
| `ollama: command not found` | Re-run install script; open a new shell |
| Model download fails | Check disk space (`df -h`) and network |
| Aider cannot reach model | `curl http://127.0.0.1:11434/api/tags` and set `OLLAMA_API_BASE` |
| Out of memory / killed | Use smaller model (`7b` or `3b`); close other apps |
| Very slow answers | Normal on CPU; use smaller model or add GPU |
| NVIDIA not used | Install NVIDIA driver + CUDA toolkit; reinstall GPU PyTorch for ComfyUI |
| Permission denied in `/projects` | `sudo chown -R $USER:$USER /projects /opt/ai` |
| Port already in use | Change ComfyUI `--port` or stop the other process |
| OpenHands cannot see Ollama | Use host gateway IP, not `127.0.0.1`, from inside Docker |

### Useful logs

```bash
sudo journalctl -u ollama -f
# ComfyUI: watch the terminal/tmux where it runs
```

---

## 14. Model & hardware cheat sheet

| Your hardware | Pull this first |
|---------------|-----------------|
| CPU only, 8–16GB RAM | `qwen2.5-coder:7b` or `llama3.2:3b` |
| 8–12GB VRAM | `qwen2.5-coder:14b` |
| 24GB+ VRAM | `qwen2.5-coder:32b` |
| Want general chat too | also `llama3.1:8b` |

### Free stack reminder

| Use (free) | Avoid (paid) |
|------------|--------------|
| Ollama + open models | OpenAI / Claude / Gemini APIs |
| Aider / OpenHands / Continue | Cursor Pro / Copilot paid |
| ComfyUI + open image weights | Midjourney / paid image APIs |
| CrewAI self-hosted | Hosted agent SaaS |

---

## Quick copy-paste: minimal test path (15–30 min)

```bash
# 1) System
sudo apt update && sudo apt install -y curl git python3 python3-pip python3-venv build-essential
sudo mkdir -p /opt/ai /projects && sudo chown -R "$USER:$USER" /opt/ai /projects

# 2) Ollama + small model
curl -fsSL https://ollama.com/install.sh | sh
ollama pull qwen2.5-coder:7b
ollama run qwen2.5-coder:7b "Say OK"

# 3) Project
mkdir -p /projects/demo-a && cd /projects/demo-a && git init
git config user.email "test@localhost" && git config user.name "Test"
echo "# demo" > README.md && git add README.md && git commit -m init

# 4) Aider
python3 -m venv /opt/ai/venv
source /opt/ai/venv/bin/activate
pip install -U pip aider-chat
export OLLAMA_API_BASE=http://127.0.0.1:11434
aider --model ollama_chat/qwen2.5-coder:7b
```

Then ask Aider: `Create hello.py that prints Hello from my test server`

---

## Done

After the minimal path works, add:

1. Second project folder (`demo-b`)  
2. ComfyUI for images  
3. CrewAI if you want multiple agent roles  
4. OpenHands if you want a stronger autonomous UI agent  

All of the above stays **free** as long as you keep using **Ollama + open weights** on your server.
