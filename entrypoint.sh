#!/bin/bash

# Replace pg_hba.conf to use trust authentication for postgres user
cat <<EOF > /etc/postgresql/15/main/pg_hba.conf
# "local" is for Unix domain socket connections only
local   all             postgres                                trust
local   all             all                                     md5
# IPv4 local connections:
host    all             all             127.0.0.1/32            md5
# IPv6 local connections:
host    all             all             ::1/128                 md5
EOF

# Start PostgreSQL service
service postgresql start

# Wait for PostgreSQL to start
until pg_isready; do
  echo "Waiting for PostgreSQL to start..."
  sleep 2
done

# Run the database initialization script
/docker-entrypoint-initdb.d/init-db.sh

# Revert pg_hba.conf to use md5 authentication for postgres user
cat <<EOF > /etc/postgresql/15/main/pg_hba.conf
# "local" is for Unix domain socket connections only
local   all             all                                     md5
# IPv4 local connections:
host    all             all             127.0.0.1/32            md5
# IPv6 local connections:
host    all             all             ::1/128                 md5
EOF

# Reload PostgreSQL configuration
service postgresql reload

# Keep the container running
tail -f /dev/null