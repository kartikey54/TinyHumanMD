# vLLM Coding Server + OpenCode Agent Swarm

Self-hosted vLLM coding model on your Windows RTX 5080, connected to OpenCode on your Mac with a multi-agent swarm.

```
 ┌─────────────────────┐          ┌──────────────────────────┐
 │  WINDOWS (RTX 5080) │          │     MAC (OpenCode)       │
 │                     │          │                          │
 │  Docker             │   HTTP   │  opencode                │
 │  └─ vLLM            │◄────────►│  ├─ build (primary)      │
 │     └─ Qwen2.5-     │  :8000   │  ├─ plan  (primary)      │
 │        Coder-14B    │  /v1     │  ├─ orchestrator (swarm)  │
 │        AWQ          │          │  ├─ @architect            │
 │                     │          │  ├─ @reviewer             │
 │  16GB VRAM          │          │  ├─ @tester               │
 │  ~8GB model         │          │  ├─ @security             │
 │  ~7GB KV cache      │          │  └─ @debugger             │
 └─────────────────────┘          └──────────────────────────┘
```

---

## Step 1: Windows Setup (GPU Server)

### Prerequisites

- **Windows 11** with WSL2 enabled
- **Docker Desktop** with WSL2 backend
- **NVIDIA Container Toolkit** installed in WSL2
- **RTX 5080** with latest drivers (560+)

### Verify GPU access

```bash
# In WSL2 terminal
nvidia-smi
docker run --rm --gpus all nvidia/cuda:12.8.0-base-ubuntu24.04 nvidia-smi
```

### Start the server

```bash
# Clone/copy this folder to your Windows machine, then:
cd vllm-coding-server

# Copy and edit the env file (set your API key and other config):
cp .env.example .env
# Then start:
docker compose up -d

# Watch the logs (first run downloads ~8GB model):
docker compose logs -f vllm

# Wait for this line:
#   INFO:     Uvicorn running on http://0.0.0.0:8000
```

First startup takes 5-10 minutes to download the model. Subsequent starts are fast (~30 seconds) since the model is cached in a Docker volume.

### Verify the server

```bash
curl http://localhost:8000/v1/models
# Should return: {"data": [{"id": "coder", ...}]}

curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VLLM_API_KEY" \
  -d '{
    "model": "coder",
    "messages": [{"role": "user", "content": "Write a Python hello world"}],
    "max_tokens": 100
  }'
```

### Find your Windows IP

```bash
# On Windows (PowerShell):
ipconfig | findstr "IPv4"

# Or on WSL2:
hostname -I | awk '{print $1}'
```

Note the IP address (e.g., `192.168.1.100`). Your Mac needs to reach this.

### Windows Firewall

Allow inbound connections on port 8000:

```powershell
# Run PowerShell as Administrator:
New-NetFirewallRule -DisplayName "vLLM Server" -Direction Inbound -Port 8000 -Protocol TCP -Action Allow
```

---

## Step 2: Mac Setup (OpenCode Client)

### Install OpenCode

```bash
# macOS
brew install opencode
```

### Configure the connection

1. Copy `opencode.json` to your project root on Mac
2. **Edit the IP address** — replace `WINDOWS_IP` with your Windows machine's IP:

```bash
# Quick replace (run in the project directory):
sed -i '' 's/WINDOWS_IP/192.168.1.100/g' opencode.json
```

3. Copy the `.opencode/` folder to your project root for the agent swarm definitions.

### Verify connection from Mac

```bash
# Test that your Mac can reach the vLLM server:
curl http://192.168.1.100:8000/v1/models -H "Authorization: Bearer $VLLM_API_KEY"
```

### Launch OpenCode

```bash
cd your-project
opencode
```

---

## Step 3: Using the Agent Swarm

### Built-in Agents

| Agent | Type | Description |
|-------|------|-------------|
| **build** | primary | Default. Full tool access for implementing code |
| **plan** | primary | Read-only. Analyzes code and creates plans |
| **orchestrator** | primary | Swarm coordinator. Delegates to specialist agents |

Switch between primary agents with **Tab**.

### Specialist Agents (invoke with @)

| Agent | Specialty |
|-------|-----------|
| `@architect` | System design, interfaces, architecture decisions |
| `@reviewer` | Code review, quality checks, best practices |
| `@tester` | Unit tests, integration tests, edge cases |
| `@refactorer` | Code cleanup, deduplication, optimization |
| `@debugger` | Bug investigation, error tracing, root cause analysis |
| `@security` | Vulnerability scanning, OWASP checks, auth review |
| `@docs` | Documentation, READMEs, docstrings, API docs |

### Swarm Workflow Example

1. Switch to the **orchestrator** agent (Tab)
2. Describe your feature:
   ```
   Build a REST API with user authentication, rate limiting, and PostgreSQL storage
   ```
3. The orchestrator will:
   - Call `@architect` to design the system
   - Implement code itself (has full tool access)
   - Call `@tester` to generate tests
   - Call `@reviewer` for a quality pass
   - Call `@security` for a vulnerability scan

### Manual Agent Invocation

You can invoke any agent directly from any primary agent:

```
@reviewer check the auth middleware in src/middleware/auth.ts
@tester write tests for the UserService class
@security audit the payment processing module
```

---

## Remote Access via Cloudflare Tunnel

Access vLLM from anywhere at `https://vllm.kartikey54.com/v1` using the existing Cloudflare tunnel.

```
 Client (Cursor / OpenCode / scripts)
   |  HTTPS + Bearer API key
   v
 Cloudflare Edge (TLS)
   |  Encrypted tunnel
   v
 cloudflared (localhost)
   |  HTTP
   v
 Caddy (:8001) — Basic Auth
   |
   v
 vLLM (:8000) — API key auth
```

### Setup (one-time)

#### 1. Configure secrets

```bash
cd vllm-coding-server

# Copy the example env and fill in your secrets:
cp .env.example .env
# Then edit .env — set VLLM_API_KEY and CADDY_BASIC_AUTH_HASH
# (see comments in .env.example for how to generate strong values)
```

#### 2. Start the Caddy proxy

```bash
# Start Caddy reverse proxy with Basic Auth on port 8001
docker compose -f docker-compose.proxy.yml up -d
```

#### 3. Add hostname in Cloudflare Zero Trust dashboard

1. Go to **Networks > Tunnels** > select your tunnel
2. **Public Hostname** tab > **Add a public hostname**
3. Configure:
   - Subdomain: `vllm`
   - Domain: `kartikey54.com`
   - Service type: `HTTP`
   - URL: `localhost:8001`
4. Save — the existing `cloudflared` container picks up the route automatically

#### 4. Verify remote access

```bash
# Test from any machine:
curl -u vllm:YOUR_BASIC_AUTH_PASSWORD \
  -H "Authorization: Bearer YOUR_VLLM_API_KEY" \
  https://vllm.kartikey54.com/v1/models
```

### Client configuration

For any OpenAI-compatible client (Cursor, OpenCode, aider, etc.):

```
OPENAI_API_BASE=https://vllm:YOUR_BASIC_AUTH_PASSWORD@vllm.kartikey54.com/v1
OPENAI_API_KEY=YOUR_VLLM_API_KEY
MODEL=coder
```

Or if the client doesn't support Basic Auth in the URL, set headers manually:

```
Base URL: https://vllm.kartikey54.com/v1
API Key:  YOUR_VLLM_API_KEY
Header:   Authorization: Basic <base64(vllm:password)>
```

### Security notes

- **Two layers of auth**: HTTP Basic Auth (Caddy) + Bearer API key (vLLM)
- **TLS everywhere**: Cloudflare handles HTTPS; the tunnel is encrypted end-to-end
- **Credentials**: Stored in `.env` (git-ignored, copy from `.env.example`). See `VLLM_API_KEY` and `CADDY_BASIC_AUTH_HASH`
- **No ports exposed to the internet**: Only Cloudflare tunnel connects inbound

### Skipping Caddy (minimal setup)

If you prefer just the vLLM API key without Basic Auth:

1. Point the Cloudflare tunnel hostname to `localhost:8000` instead of `8001`
2. Use only the API key for authentication
3. Note: `/health` and `/version` endpoints may be accessible without the API key

---

## Model Options

| Model | VRAM | Context | Quality | Notes |
|-------|------|---------|---------|-------|
| `Qwen/Qwen2.5-Coder-14B-Instruct-AWQ` | ~8GB | 32K | Best | **Default.** Sweet spot for 16GB |
| `Qwen/Qwen2.5-Coder-7B-Instruct` | ~14GB | 16K | Good | FP16, no quantization needed |
| `Qwen/Qwen2.5-Coder-14B-Instruct-GPTQ-Int4` | ~8GB | 32K | Best | Alternative quantization |

To switch models, edit `MODEL=` in `.env` and restart:

```bash
docker compose down && docker compose up -d
```

---

## Troubleshooting

### OOM (Out of Memory) errors

Lower the context length in `.env`:
```
MAX_MODEL_LEN=16384
```

Or reduce GPU memory utilization:
```
GPU_MEM_UTIL=0.85
```

### Slow first response

The first request after startup is slower due to CUDA kernel compilation. Subsequent requests are fast.

### Connection refused from Mac

1. Check Windows firewall allows port 8000
2. Check both machines are on the same network
3. Try pinging the Windows IP from Mac
4. If using WSL2, you may need to set up port forwarding:
   ```powershell
   # PowerShell as Admin:
   netsh interface portproxy add v4tov4 listenport=8000 listenaddress=0.0.0.0 connectport=8000 connectaddress=$(wsl hostname -I | ForEach-Object { $_.Trim() })
   ```

### Tool calling not working

The `--enable-auto-tool-choice --tool-call-parser hermes` flags enable OpenAI-compatible tool calling. If you experience issues, try switching the parser:
```
# In docker-compose.yml, change:
--tool-call-parser hermes
# To:
--tool-call-parser internlm
```

### View server logs

```bash
docker compose logs -f vllm
```
