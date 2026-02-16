FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy remaining files
COPY . .
# Remove any .env files that might have been copied
RUN rm -f .env .env.* || true

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install required libraries
RUN apk add --no-cache libc6-compat

# Create the nextjs user and group
RUN addgroup -g 1001 nodejs
RUN adduser -S nextjs -u 1001 -G nodejs

# Copy necessary files and directories
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy data directory for JSON storage
COPY --from=builder /app/data ./data

# Set the correct permission for prerender cache and data directory
RUN mkdir .next
RUN chown nextjs:nodejs /app/.next

# Ensure data directory has correct permissions
RUN chown -R nextjs:nodejs /app/data
RUN chmod 755 /app/data
RUN chmod 644 /app/data/users.json || true

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_PUBLIC_API_URL="http://localhost:3000"

ENTRYPOINT ["node", "server.js"]
