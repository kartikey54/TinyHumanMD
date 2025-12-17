# RDP Access via Cloudflare Tunnel

Secure Remote Desktop Protocol (RDP) access to your Windows PC from your Mac, protected behind a Cloudflare tunnel.

## Security Features

- ✅ **Cloudflare Tunnel**: No exposed ports, all traffic encrypted through Cloudflare
- ✅ **Zero Trust**: Access controlled via Cloudflare Zero Trust policies
- ✅ **No Direct Exposure**: RDP port (3389) never exposed to the internet
- ✅ **Encrypted Connection**: All traffic encrypted end-to-end

## Prerequisites

1. **Cloudflare Account** with Zero Trust enabled
2. **Windows RDP Enabled** on your PC
3. **Cloudflare Tunnel** created in Zero Trust dashboard

## Setup Instructions

### Step 1: Enable RDP on Windows

1. Open **Settings** → **System** → **Remote Desktop**
2. Enable **"Enable Remote Desktop"**
3. Note your Windows username (you'll need this to connect)
4. (Optional) Configure Windows Firewall to allow RDP (usually automatic)

### Step 2: Create Cloudflare Tunnel

1. Go to [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)
2. Navigate to **Networks** → **Tunnels**
3. Click **"Create a tunnel"**
4. Choose **"Cloudflared"** as the connector
5. Name it (e.g., "rdp-tunnel")
6. Copy the **Tunnel Token** or download the **credentials.json**

### Step 3: Configure Tunnel

#### Option A: Using Tunnel Token (Recommended - Simplest)

1. Create a `.env` file in the `rdp` directory:
   ```bash
   TUNNEL_TOKEN=your_tunnel_token_here
   ```
2. Use the simple docker-compose file:
   ```bash
   docker-compose -f docker-compose.simple.yaml up -d
   ```
3. **Configure ingress in Cloudflare Dashboard** (not in config file):
   - Go to Zero Trust → Networks → Tunnels → Your Tunnel
   - Click **"Configure"** → **"Public Hostname"**
   - Add: `rdp.yourdomain.com` → `tcp://localhost:3389` → Type: TCP
   - Save

#### Option B: Using Named Tunnel with credentials.json

1. Download `credentials.json` from Cloudflare Zero Trust dashboard
2. Place it in the `rdp` directory
3. Update `config.yaml` with your tunnel ID
4. Remove `TUNNEL_TOKEN` from docker-compose.yaml (not needed with credentials.json)

### Step 4: Configure DNS (if not done in Step 3)

If using Option A (token-based), you already configured this in Step 3.

If using Option B (credentials.json), configure here:
1. In Cloudflare Zero Trust dashboard, go to your tunnel
2. Click **"Configure"** → **"Public Hostname"**
3. Add a new public hostname:
   - **Subdomain**: `rdp` (or your choice)
   - **Domain**: Your domain (e.g., `kartikey54.com`)
   - **Service**: `tcp://localhost:3389`
   - **Type**: TCP

### Step 5: Set Up Zero Trust Access Policy (Recommended)

1. In Zero Trust dashboard, go to **Access** → **Applications**
2. Click **"Add an application"**
3. Select **"Self-hosted"**
4. Configure:
   - **Application name**: RDP Access
   - **Session Duration**: 24 hours (or your preference)
   - **Application domain**: `rdp.yourdomain.com`
5. Add **Access Policy**:
   - **Policy name**: "RDP Access Policy"
   - **Action**: Allow
   - **Include**: 
     - Email: `your-email@example.com` (your Mac user email)
     - Or use other identity providers (Google, GitHub, etc.)
   - **Require**: 
     - Email verification
     - (Optional) Device posture checks
6. Save the application

### Step 6: Start the Tunnel

**For Option A (Token-based - Recommended):**
```bash
cd rdp
docker-compose -f docker-compose.simple.yaml up -d
```

**For Option B (Config-based):**
```bash
cd rdp
docker-compose up -d
```

Check logs:
```bash
docker-compose logs -f cloudflared-rdp
# or for simple version:
docker-compose -f docker-compose.simple.yaml logs -f cloudflared-rdp
```

### Step 7: Connect from Mac

1. Install Microsoft Remote Desktop from Mac App Store (free)
2. Open Microsoft Remote Desktop
3. Click **"Add PC"**
4. Enter:
   - **PC name**: `rdp.yourdomain.com`
   - **User account**: `WindowsUsername` (your Windows username)
   - **Password**: Your Windows password
5. Click **"Add"**
6. Double-click the connection to connect

## Security Best Practices

1. **Use Strong Windows Password**: Ensure your Windows account has a strong password
2. **Enable Windows Firewall**: Keep it enabled
3. **Use Zero Trust Policies**: Restrict access to only your email/identity
4. **Regular Updates**: Keep Windows and Cloudflared updated
5. **Monitor Access**: Check Cloudflare Zero Trust logs regularly
6. **Use MFA**: Enable multi-factor authentication in Cloudflare Zero Trust
7. **Session Timeout**: Configure appropriate session durations
8. **Disable RDP When Not Needed**: Stop the tunnel when not in use

## Troubleshooting

### Cannot Connect

1. **Check Tunnel Status**:
   ```bash
   docker-compose logs cloudflared-rdp
   ```

2. **Verify RDP is Enabled**:
   - Windows Settings → System → Remote Desktop → Should be ON

3. **Check Firewall**:
   - Windows Firewall should allow RDP (usually automatic)
   - Check if port 3389 is listening: `netstat -an | findstr 3389`

4. **Verify Cloudflare Tunnel**:
   - Check Zero Trust dashboard → Networks → Tunnels
   - Ensure tunnel shows as "Healthy"

5. **Check DNS**:
   - Verify `rdp.yourdomain.com` resolves correctly
   - Use: `nslookup rdp.yourdomain.com`

### Connection Drops

- Increase `keepAliveTimeout` in `config.yaml`
- Check network stability
- Verify Cloudflare tunnel health

## Stopping the Service

```bash
docker-compose down
```

## Files

- `config.yaml`: Cloudflare tunnel configuration
- `docker-compose.yaml`: Docker service definition
- `credentials.json`: Tunnel credentials (if using named tunnel - not in git)
- `.env`: Environment variables (create this, not in git)

## Notes

- The RDP port (3389) is **never exposed** to the internet
- All traffic goes through Cloudflare's encrypted tunnel
- Access is controlled via Cloudflare Zero Trust policies
- This setup is more secure than exposing RDP directly

