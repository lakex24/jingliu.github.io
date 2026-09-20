#!/bin/zsh
# Rebuild Dori's site on the Mac mini. The LaunchAgent com.mind-pixels.dori-homepage
# serves dori/dist on 127.0.0.1:4382 → Cloudflare tunnel → dori-homepage.mind-pixels.com.
set -euo pipefail
cd "$(dirname "$0")"
npm ci --no-audit --no-fund
npm run build
echo "dori-homepage rebuilt: $(date '+%Y-%m-%d %H:%M')"
