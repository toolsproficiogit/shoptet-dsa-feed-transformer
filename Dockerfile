# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable

# === SUBFOLDER VARIANT (change folder name) ===
COPY shoptet-csv-marketing-transformer/package.json shoptet-csv-marketing-transformer/pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

COPY shoptet-csv-marketing-transformer/ ./
RUN pnpm run build

# === ROOT VARIANT (if app is at repo root) ===
# COPY package.json pnpm-lock.yaml* ./
# RUN pnpm install --frozen-lockfile || pnpm install
# COPY . ./
# RUN pnpm run build

# ---- Runtime stage ----
FROM node:22-alpine
WORKDIR /app

RUN npm install -g serve

# Vite output is usually dist/
COPY --from=build /app/dist ./dist

EXPOSE 8080
CMD ["serve", "-s", "dist", "-l", "8080"]
