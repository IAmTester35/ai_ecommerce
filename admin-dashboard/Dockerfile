# ==========================================
# STAGE 1: Build Vite React Application
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package.json yarn.lock* ./

# Install dependencies (fallback to npm if yarn lockfile has mismatch)
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile --ignore-engines || yarn install --ignore-engines; else npm install; fi

# Copy application source code
COPY . .

# Build arguments for Vite environment variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_URL

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_API_URL=$VITE_API_URL

# Build production bundle
RUN npm run build

# ==========================================
# STAGE 2: Lightweight Production Nginx
# ==========================================
FROM nginx:alpine AS runner

# Copy built static files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
