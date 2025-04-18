# Stage 1: Builder
FROM node:18 AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Optional: Prune development dependencies (if package-lock.json is precise)
# RUN npm prune --production


# Stage 2: Production Runner
FROM node:18

WORKDIR /app

# Install netcat for the wait script
RUN apt-get update && apt-get install -y netcat-traditional && rm -rf /var/lib/apt/lists/*

# Copy necessary files from the builder stage
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/.next /app/.next
COPY --from=builder /app/public /app/public
COPY --from=builder /app/start.sh /app/start.sh
COPY --from=builder /app/scripts/init-db.js /app/scripts/init-db.js
COPY --from=builder /app/init.sql /app/init.sql
# Ensure the data directory structure exists in the final image if needed
# RUN mkdir -p /app/data
COPY --from=builder /app/data/merged.json /app/data/merged.json


# Make the start script executable
RUN chmod +x /app/start.sh

# Expose the port the app runs on
EXPOSE 3000

# Set user to non-root (optional but good practice)
# USER node

# Start the application using the wait script
CMD ["/app/start.sh"] 