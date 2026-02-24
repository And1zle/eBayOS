FROM node:20-slim

# openssl needed to generate self-signed cert
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps first (layer cache)
COPY package.json package-lock.json* ./
RUN npm install

# Copy source
COPY . .

# Build Vite frontend → dist/
RUN npm run build

# Generate self-signed TLS cert (valid 10 years)
RUN openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 3650 -nodes \
    -subj "/C=US/ST=Local/L=Local/O=eBayOS/CN=ebayos"

# In production, server.ts serves dist/ as static files over HTTPS
ENV NODE_ENV=production
ENV PORT=4873

EXPOSE 4873

CMD ["node", "node_modules/tsx/dist/cli.mjs", "server.ts"]
