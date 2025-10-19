# syntax=docker/dockerfile:1.6

FROM node:20-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --include=dev

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
COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/prisma ./prisma
EXPOSE 3000
USER node
CMD ["node", "dist/src/main.js"]
