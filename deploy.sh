#!/bin/bash
set -e

APP_DIR="/var/www/Himalayan-Moosa-server"
APP_NAME="himalayan-moosa"

echo "🚀 Starting deployment..."

cd "$APP_DIR"

echo "📦 Pulling latest code..."
git pull origin main

echo "📥 Installing dependencies..."
npm install --omit=dev

echo "🔄 Restarting app..."
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  pm2 restart "$APP_NAME" --update-env
else
  pm2 start npm --name "$APP_NAME" -- start
fi

pm2 save

echo "✅ Deployment complete!"
pm2 status

echo "🏥 Health check..."
sleep 2
curl -sf "http://localhost:3004/api/health" && echo "" || echo "⚠️  Health check failed — run: pm2 logs $APP_NAME"
