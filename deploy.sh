#!/bin/bash
set -e

echo "🚀 eBayOS Deployment Script"
echo "============================"
echo ""

echo "📦 Building frontend..."
npm run build

echo ""
echo "📦 Creating deployment archive..."
tar czf ebayos.tar.gz dist/ server.ts package.json package-lock.json Dockerfile docker-compose.yml .env.example

echo ""
echo "📡 Uploading to server (pop-os)..."
scp ebayos.tar.gz tedmo@100.67.134.63:/home/tedmo/ebayos/

echo ""
echo "🔧 Deploying on server..."
ssh tedmo@100.67.134.63 << 'EOF'
  set -e
  cd /home/tedmo/ebayos/

  # Backup current dist
  if [ -d dist/ ]; then
    cp -r dist/ dist.backup/
    echo "✓ Backed up dist/ to dist.backup/"
  fi

  # Extract new build
  tar xzf ebayos.tar.gz
  echo "✓ Extracted new build"

  # Ensure Tailscale certs exist
  if [ ! -f /etc/certs/tailscale/pop-os.tail2de5b8.ts.net.crt ]; then
    echo "🔐 Generating Tailscale certs..."
    sudo tailscale cert pop-os.tail2de5b8.ts.net
  fi
  echo "✓ Tailscale certs ready"

  # Rebuild + restart
  echo "🐳 Rebuilding Docker image and starting container..."
  docker-compose up -d --build

  # Wait for container to be healthy
  echo "⏳ Waiting for container to become healthy..."
  for i in {1..30}; do
    if docker-compose ps | grep -q 'ebayos.*healthy'; then
      echo "✓ Container is healthy"
      break
    fi
    echo "  Attempt $i/30..."
    sleep 2
  done

  echo ""
  echo "✅ Deployment complete!"
  echo ""
  echo "🌐 App available at: https://pop-os.tail2de5b8.ts.net:4873"
  echo "📊 Dashboard: https://pop-os.tail2de5b8.ts.net:4873"
EOF

echo ""
echo "✅ Deployment successful!"
