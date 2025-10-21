# syntax=docker/dockerfile:1.6

FROM node:20-slim AS base
WORKDIR /app
ENV PUPPETEER_CACHE_DIR=/home/node/.cache/puppeteer
RUN mkdir -p ${PUPPETEER_CACHE_DIR} \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libdrm2 \
    libgbm1 \
    libxshmfence1 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    openssl \
    wget \
    xdg-utils \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --include=dev && chown -R node:node ${PUPPETEER_CACHE_DIR}

FROM deps AS builder
COPY prisma ./prisma
RUN ./node_modules/.bin/prisma generate
COPY . .
RUN npm run build

FROM deps AS prod-deps
RUN npm prune --omit=dev

FROM base AS runner
ENV NODE_ENV=production
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=deps /home/node/.cache/puppeteer /home/node/.cache/puppeteer
COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/prisma ./prisma
COPY --chown=node:node --from=builder /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 3001
USER node
ENV PUPPETEER_CACHE_DIR=/home/node/.cache/puppeteer
CMD ["node", "dist/src/main.js"]
