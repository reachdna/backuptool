#!/bin/bash

# Wait for PostgreSQL to start
until pg_isready -h localhost -p 5432 -U backup_tool; do
  echo "Waiting for PostgreSQL to start..."
  sleep 2
done

# Connect to PostgreSQL and set the correct permissions
PGPASSWORD=backup_tool_local psql -h localhost -U backup_tool -d backup_tool <<-EOSQL
  ALTER SCHEMA public OWNER TO backup_tool;
EOSQL