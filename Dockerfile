# Stage 1: Build frontend (optional - si usas Vite para assets)
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev
COPY . .
RUN npm run build 2>/dev/null || true

# Stage 2: App
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

# Prisma
COPY prisma ./prisma
RUN npx prisma generate

COPY . .

# Frontend build (si existe)
COPY --from=frontend /app/public/build /app/public/build 2>/dev/null || true

ENV NODE_ENV=production
ENV PORT=8000

EXPOSE 8000

COPY render-deploy.sh /render-deploy.sh
RUN chmod +x /render-deploy.sh

CMD ["/render-deploy.sh"]
