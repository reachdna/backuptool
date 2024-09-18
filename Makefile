# Variables
DOCKER_COMPOSE = docker-compose

# Initialize the project
init: docker-down docker-up install init-role setup init-db

# Install dependencies
install:
	npm install

# Setup
setup:
	./file_gen.sh

# Take a snapshot
backup:
	./backup.sh

# List of snapshots
list:
	./list.sh

# Check for corrupted content
check:
	./check.sh

# Restore a snapshot 
restore:
	./restore.sh $(filter-out $@,$(MAKECMDGOALS))

# Prune a snapshot 
prune:
	./prune.sh $(filter-out $@,$(MAKECMDGOALS))

# Run tests
test:
	npm test

# Build and start Docker Compose services
docker-up:
	$(DOCKER_COMPOSE) up -d --build

# Stop Docker Compose services
docker-down:
	$(DOCKER_COMPOSE) down
# docker volume rm takehome-gridunity_pgdata

# Initialize the backup_tool user role 
init-role:
	./init_role.sh

# Initialize the database with JavaScript
init-db:
	node init_db.js

# Clean Docker images and containers
docker-clean:
	docker system prune -f

# Ignore arguments for specific targets
%:
	@:
