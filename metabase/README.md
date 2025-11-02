# Metabase

Analytics dashboard accessible at `analytics.kartikey54.com`

## Setup

1. Create a `.env` file with:
   ```
   METABASE_DB_PASSWORD=your_secure_password
   ```

2. Start the services:
   ```bash
   docker-compose up -d
   ```

3. Access Metabase at: http://localhost:3000
   - First time setup will ask you to create an admin account

## Services

- **Metabase**: Main application on port 3000
- **PostgreSQL**: Database for Metabase metadata on port 5432

## Volumes

- `metabase_data`: Metabase application data
- `metabase_postgres_data`: PostgreSQL database data

