#!/usr/bin/env bash
# =============================================================================
# bootstrap-vps.sh — One-time VPS setup for portl-server
#
# Run this ONCE on the VPS (as root):
#   bash bootstrap-vps.sh
#
# What it does:
#   1. Installs Docker Engine + Docker Compose plugin
#   2. Clones the portl repo to /opt/portl
#   3. Creates /opt/portl/server/.env from your answers
# =============================================================================

set -euo pipefail

REPO_URL="https://github.com/vpdevs001/portl.git"   # <-- update if different
REPO_DIR="/opt/portl"

echo ""
echo "┌─────────────────────────────────────────┐"
echo "│   portl-server VPS Bootstrap Script     │"
echo "└─────────────────────────────────────────┘"
echo ""

# ── 1. Install Docker ──────────────────────────────────────────────────────
if command -v docker &>/dev/null; then
  echo "✅ Docker already installed: $(docker --version)"
else
  echo "🔧 Installing Docker..."
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl gnupg lsb-release

  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg

  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list

  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

  systemctl enable --now docker
  echo "✅ Docker installed: $(docker --version)"
fi

# ── 2. Clone repo ─────────────────────────────────────────────────────────
if [ -d "$REPO_DIR/.git" ]; then
  echo "✅ Repo already exists at $REPO_DIR, pulling latest..."
  git -C "$REPO_DIR" pull origin main
else
  echo "📦 Cloning repo to $REPO_DIR..."
  git clone "$REPO_URL" "$REPO_DIR"
fi

# ── 3. Create .env ─────────────────────────────────────────────────────────
ENV_FILE="$REPO_DIR/server/.env"

if [ -f "$ENV_FILE" ]; then
  echo "✅ .env already exists at $ENV_FILE — skipping creation."
  echo "   Edit it manually if you need to update secrets."
else
  echo ""
  echo "📝 Creating $ENV_FILE — paste your secrets when prompted."
  echo ""

  cat > "$ENV_FILE" << 'EOF'
PORT="8000"
NODE_ENV="production"

# External Neon Postgres URL (already managed externally)
DATABASE_URL=""

BETTER_AUTH_SECRET=""
BETTER_AUTH_URL="https://portl.vedpandey.in"

GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

IMAGEKIT_PRIVATE_KEY=""
EOF

  echo ""
  echo "⚠️  .env created at $ENV_FILE with empty values."
  echo "   Fill in the secrets before starting the stack:"
  echo "   nano $ENV_FILE"
  echo ""
fi

# ── 4. Initial deploy ──────────────────────────────────────────────────────
echo ""
read -r -p "🚀 Start the Docker stack now? [y/N] " START_NOW
if [[ "${START_NOW,,}" == "y" ]]; then
  cd "$REPO_DIR/server"
  docker compose -f docker-compose.prod.yml up -d --build
  echo ""
  echo "✅ Stack started! Check status with:"
  echo "   docker compose -f $REPO_DIR/server/docker-compose.prod.yml ps"
else
  echo ""
  echo "Skipped. When ready, run:"
  echo "   cd $REPO_DIR/server && docker compose -f docker-compose.prod.yml up -d --build"
fi

echo ""
echo "🎉 Bootstrap complete!"
