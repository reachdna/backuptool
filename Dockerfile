# Use the official Node.js image from the Docker Hub
FROM node:14

# Create and set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Install PostgreSQL 15
RUN apt-get update && \
    apt-get install -y wget gnupg2 lsb-release && \
    echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list && \
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - && \
    apt-get update && \
    apt-get install -y postgresql-15 postgresql-client-15 && \
    rm -rf /var/lib/apt/lists/*

# Copy the PostgreSQL configuration files
COPY ./init-db.sh /docker-entrypoint-initdb.d/init-db.sh

# Expose the ports the app and PostgreSQL run on
EXPOSE 5432

# Copy the entrypoint script
COPY ./entrypoint.sh /usr/src/app/entrypoint.sh
RUN chmod +x /usr/src/app/entrypoint.sh

# Command to run the entrypoint script
CMD ["/usr/src/app/entrypoint.sh"]