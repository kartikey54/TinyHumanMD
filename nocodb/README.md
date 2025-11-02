# NocoDB

Database interface (Airtable alternative) accessible at `data.kartikey54.com`

## Setup

1. Create a `.env` file with:
   ```
   NOCODB_DB_PASSWORD=your_secure_password
   NC_AUTH_JWT_SECRET=your-super-secret-jwt-token-change-me
   ```

2. Start the services:
   ```bash
   docker-compose up -d
   ```

3. Access NocoDB at: http://localhost:8080
   - First time setup will ask you to create an admin account

## Services

- **NocoDB**: Main application on port 8080
- **PostgreSQL**: Database for NocoDB metadata and user data

## Volumes

- `nocodb_data`: NocoDB application data
- `nocodb_postgres_data`: PostgreSQL database data

## Features

- Create spreadsheet-like interfaces for databases
- Connect to existing databases or create new ones
- Share views with team members
- API access to your data

