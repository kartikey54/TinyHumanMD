# Supabase

Backend as a Service accessible at `supa.kartikey54.com`

## Setup

1. Create a `.env` file with:
   ```
   SUPABASE_DB_PASSWORD=your_secure_password
   JWT_SECRET=your-super-secret-jwt-token-change-me
   ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_KEY=your-service-role-key-here
   ```

2. Start the services:
   ```bash
   docker-compose up -d
   ```

3. Access services:
   - Studio UI: http://localhost:3001
   - API Gateway (Kong): http://localhost:8000
   - REST API: http://localhost:3002
   - Storage API: http://localhost:5000
   - Realtime: http://localhost:4000

## Services

- **PostgreSQL**: Main database
- **Studio**: Web UI for managing Supabase
- **Kong**: API Gateway
- **GoTrue (Auth)**: Authentication service
- **PostgREST (REST)**: REST API generator
- **Storage**: File storage service
- **Meta**: Database metadata API
- **Realtime**: Real-time subscriptions

## Volumes

- `supabase_postgres_data`: PostgreSQL database data
- `supabase_storage_data`: File storage data

## Note

This is a simplified Supabase setup. For production, you may want to use the official Supabase CLI and additional configuration.

