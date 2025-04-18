#!/bin/sh

echo "Waiting for PostgreSQL to start..."
while ! nc -z db 5432; do
  sleep 0.1
done
echo "PostgreSQL started"

echo "Initializing database..."
node scripts/init-db.js

echo "Starting the application..."
npm run start 