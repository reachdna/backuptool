#!/bin/bash

# Start PostgreSQL service
service postgresql start

# Wait for PostgreSQL to start
until pg_isready; do
  echo "Waiting for PostgreSQL to start..."
  sleep 2
done

# Set the password for the postgres user
psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';"

# Create the database and user
psql -U postgres -c "CREATE DATABASE backup_tool;"
psql -U postgres -c "CREATE USER backup_tool WITH PASSWORD 'backup_tool_local';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE backup_tool TO backup_tool;"

# Grant ownership of the public schema to the backup_tool user
psql -U postgres -d backup_tool -c "ALTER SCHEMA public OWNER TO backup_tool;"

# Wait for PostgreSQL to be ready with the new password
until pg_isready -h localhost -p 5432 -U postgres -d postgres; do
  echo "Waiting for PostgreSQL to be ready with the new password..."
  sleep 2
done