FROM node:20-slim

WORKDIR /app

# Install deps first (layer cache)
COPY package.json package-lock.json* ./
RUN npm install --only=production

# Copy source
COPY . .

# Build Vite frontend → dist/
RUN npm run build

# NOTE: TLS certs are volume-mounted from Tailscale at runtime:
# /etc/certs/tailscale/pop-os.tail2de5b8.ts.net.{crt,key}
# See docker-compose.yml for volume configuration

# In production, server.ts serves dist/ as static files over HTTPS
ENV NODE_ENV=production
ENV PORT=4873

EXPOSE 4873

# Health check
HEALTHCHECK --interval=30s --timeout=3s --retries=3 --start-period=10s \
  CMD node -e "require('http').get('http://localhost:4873/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "node_modules/tsx/dist/cli.mjs", "server.ts"]
