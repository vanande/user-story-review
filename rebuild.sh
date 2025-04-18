#!/bin/bash

# Stop and remove existing containers
echo "Stopping and removing existing containers..."
docker-compose down

# Remove volumes to ensure a clean state
echo "Removing volumes..."
docker volume rm user-story-review_pgdata user-story-review_node_modules || true

# Rebuild the containers
echo "Rebuilding containers..."
docker-compose build

# Start the containers
echo "Starting containers..."
docker-compose up -d

# Show logs
echo "Showing logs..."
docker-compose logs -f 