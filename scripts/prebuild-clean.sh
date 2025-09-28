#!/usr/bin/env bash
set -e

echo "🧹 Cleaning Docker and system caches before build..."

# Docker cleanup
sudo docker system prune -af --volumes

# Apt cache cleanup
sudo apt-get clean

# Trim logs (last 3 days only)
sudo journalctl --vacuum-time=3d

echo "✅ Cleanup done, safe to build now."
