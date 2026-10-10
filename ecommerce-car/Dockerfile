# ==========================================
# STAGE 1: Build Expo Web Application
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package.json yarn.lock* ./

# Install dependencies with build cache mount (fallback to npm if yarn lockfile has mismatch)
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    if [ -f yarn.lock ]; then yarn install --frozen-lockfile --ignore-engines || yarn install --ignore-engines; else npm install; fi

# Copy application source code
COPY . .

# Build arguments for Expo Web public environment variables
ARG EXPO_PUBLIC_SUPABASE_URL
ARG EXPO_PUBLIC_SUPABASE_ANON_KEY
ARG EXPO_PUBLIC_API_URL

ENV EXPO_PUBLIC_SUPABASE_URL=$EXPO_PUBLIC_SUPABASE_URL \
    EXPO_PUBLIC_SUPABASE_ANON_KEY=$EXPO_PUBLIC_SUPABASE_ANON_KEY \
    EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL \
    CI=1

# Export static web bundle to /app/dist
RUN npx expo export --platform web

# ==========================================
# STAGE 2: Lightweight Production Nginx
# ==========================================
FROM nginx:alpine AS runner

# Copy built static files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration for Expo Router web routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
