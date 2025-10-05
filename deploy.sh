#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

# Source NVM to make node and npm available to the script
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "Starting deployment process..."

# Pull the latest changes from the main branch
echo "1. Pulling latest code from GitHub..."
git pull origin main

# --- MODIFIED BLOCK: Gracefully stop old containers before starting new ones ---
echo "2. Stopping and removing old containers..."
# The 'down' command stops and removes all containers, networks, etc.
# defined in the docker-compose.yml file. This ensures a clean slate.
sudo docker-compose down

echo "3. Building and starting new containers..."
# The 'up' command will now create fresh containers without any conflicts.
sudo docker-compose up -d --build
# --- END OF MODIFICATION ---

echo "Waiting for containers to start..."
sleep 5 

echo "4. Seeding the PostgreSQL database..."
# This command remains the same as it targets the container by its name
sudo docker exec chat-backend-container python scripts/seed.py

# Redeploy the frontend
echo "5. Redeploying frontend..."
cd frontend
npm install
npm run build
pm2 restart chat-frontend
cd ..

echo "Deployment finished successfully!"