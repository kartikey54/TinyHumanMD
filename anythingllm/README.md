         # AnythingLLM Setup

AnythingLLM is a self-hosted document chatbot that connects to Ollama for local LLM inference.

## Architecture

- **AnythingLLM**: Main application (port 3001)
- **Qdrant**: Vector database for embeddings (ports 6333, 6334)
- **Ollama**: LLM provider (running separately on port 11434)

## Prerequisites

1. **Ollama must be running** on port 11434
   - Make sure your `ollama` service is up: `cd ollama && docker-compose up -d`
   - **GPU Support**: Ollama is configured to use GPU if available (NVIDIA GPU required)
   - AnythingLLM itself doesn't need GPU - it just sends requests to Ollama
   - All LLM inference happens in Ollama, which will use your GPU automatically

## Setup Instructions

### 1. Start AnythingLLM

```bash
cd anythingllm
docker-compose up -d
```

### 2. Access the Web UI

Open your browser and navigate to:
```
http://localhost:3001
```

### 3. Initial Setup

1. **Create Admin Account**: First-time setup will prompt you to create an admin account
2. **Configure LLM Provider**:
   - Go to Settings → LLM Preference
   - Select **Ollama** as the provider
   - The base URL should be: `http://host.docker.internal:11434`
   - Or if Ollama is on the same Docker network: `http://ollama:11434`
3. **Select Model**: Choose an Ollama model you have installed (e.g., `llama3`, `mistral`, `qwen`)

### 4. Configure Vector Database

- Qdrant is already configured and running
- No additional setup needed - AnythingLLM will connect automatically

## Connecting to Ollama

The compose file is configured to connect to Ollama running on the host at `localhost:11434` using `host.docker.internal`.

### Alternative: Connect via Docker Network

If you want to connect via Docker network instead:

1. **Option A**: Add Ollama to the same network
   - Update `ollama/docker-compose.yaml` to use network: `anythingllm-net`
   - Change `OLLAMA_BASE_PATH` to: `http://ollama:11434`

2. **Option B**: Use host network mode (not recommended for production)

## Usage

1. **Upload Documents**: 
   - Go to Workspaces → Create New Workspace
   - Upload PDFs, text files, or other documents
   - Documents will be processed and embedded into Qdrant

2. **Chat with Documents**:
   - Select a workspace
   - Ask questions about your uploaded documents
   - AnythingLLM will use RAG (Retrieval Augmented Generation) to answer

3. **Manage Models**:
   - Install models in Ollama: `ollama pull llama3`
   - Select the model in AnythingLLM settings

## Environment Variables

- `SERVER_PORT`: Port for the web UI (default: 3001)
- `VECTOR_DB`: Vector database type (qdrant)
- `QDRANT_ENDPOINT`: Qdrant connection URL
- `LLM_PROVIDER`: LLM provider (ollama)
- `OLLAMA_BASE_PATH`: Ollama API endpoint
- `API_KEY`: Optional API key for programmatic access
- `JWT_SECRET`: Optional JWT secret for authentication

## GPU Usage

**Important**: AnythingLLM doesn't run LLM inference - it only sends requests to Ollama. All GPU usage happens in the Ollama container.

- **Ollama** is configured to use NVIDIA GPU (see `ollama/docker-compose.yaml`)
- **AnythingLLM** runs on CPU (it's just a web interface and API)
- **Qdrant** runs on CPU (vector operations are fast enough on CPU)

To verify GPU is being used:
```bash
# Check if Ollama detects GPU
docker exec ollama ollama ps

# Check GPU usage while running inference
nvidia-smi
```

If GPU isn't working:
1. Make sure you have NVIDIA Docker runtime installed
2. Check: `docker run --rm --gpus all nvidia/cuda:11.0.3-base-ubuntu20.04 nvidia-smi`
3. If that fails, you may need to install NVIDIA Container Toolkit

## Recommended Models for RTX 5080 (16GB VRAM)

With 16GB VRAM, you can run large, high-quality models. Here are the best options:

### Top Recommendations:

1. **Llama 3.1 70B** (Best overall quality)
   ```bash
   docker exec ollama ollama pull llama3.1:70b-q4_K_M
   ```
   - Excellent reasoning and coding
   - ~40GB quantized to ~14GB (fits in 16GB)
   - Great for general purpose and RAG

2. **Qwen2.5 72B** (Best for coding and math)
   ```bash
   docker exec ollama ollama pull qwen2.5:72b-q4_K_M
   ```
   - Superior coding and mathematical reasoning
   - ~40GB quantized to ~14GB
   - Excellent for technical documents

3. **DeepSeek-V2.5** (Best for long context)
   ```bash
   docker exec ollama ollama pull deepseek-r1:7b
   ```
   - 64K context window
   - Great for long documents
   - Smaller model, very fast

4. **Mixtral 8x22B** (Best for complex reasoning)
   ```bash
   docker exec ollama ollama pull mixtral:8x22b-q4_K_M
   ```
   - Mixture of experts architecture
   - Excellent for complex tasks
   - ~44GB quantized to ~16GB (may need Q4_0 for tight fit)

### For RAG/Document Chat (AnythingLLM):

**Best choice: Llama 3.1 70B Q4_K_M**
- Best balance of quality, speed, and VRAM usage
- Excellent at understanding context from documents
- Great reasoning capabilities

**Alternative: Qwen2.5 72B Q4_K_M**
- If you're working with technical/code-heavy documents
- Slightly better at code and math

### Pulling Models:

```bash
# Pull recommended model
docker exec ollama ollama pull llama3.1:70b-q4_K_M

# Or pull Qwen for technical docs
docker exec ollama ollama pull qwen2.5:72b-q4_K_M

# List available models
docker exec ollama ollama list

# Test a model
docker exec ollama ollama run llama3.1:70b-q4_K_M
```

### Quantization Levels Explained:

- **Q4_K_M**: Good balance (recommended for 16GB)
- **Q5_K_M**: Better quality, needs more VRAM (~18GB for 70B)
- **Q8_0**: Near full precision, needs ~32GB for 70B
- **Q4_0**: Smaller, faster, slightly lower quality

For 16GB VRAM, **Q4_K_M** is the sweet spot for 70B models.

## Troubleshooting

### Cannot Connect to Ollama

1. **Check Ollama is Running**:
   ```bash
   docker ps | grep ollama
   curl http://localhost:11434/api/tags
   ```

2. **Verify Network Connectivity**:
   - From AnythingLLM container: `docker exec anythingllm ping host.docker.internal`
   - Or test: `docker exec anythingllm curl http://host.docker.internal:11434/api/tags`

3. **Check Firewall**: Ensure port 11434 is accessible

### Qdrant Connection Issues

1. Check Qdrant logs:
   ```bash
   docker-compose logs qdrant
   ```

2. Verify Qdrant is healthy:
   ```bash
   curl http://localhost:6333/health
   ```

### Models Not Showing

1. Make sure you've pulled models in Ollama:
   ```bash
   docker exec ollama ollama pull llama3
   ```

2. Restart AnythingLLM after pulling new models:
   ```bash
   docker-compose restart anythingllm
   ```

## Stopping the Service

```bash
docker-compose down
```

To remove all data (including uploaded documents):
```bash
docker-compose down -v
```

## Data Persistence

- **AnythingLLM data**: Stored in `anythingllm-storage` volume
- **Uploaded files**: Stored in `anythingllm-uploads` volume
- **Vector embeddings**: Stored in `qdrant-storage` volume

All data persists across container restarts.

## Security Notes

- The default setup has no authentication enabled
- For production, set `API_KEY` and `JWT_SECRET` environment variables
- Consider adding authentication/authorization
- If exposing to internet, use a reverse proxy (nginx, Cloudflare Tunnel, etc.)

