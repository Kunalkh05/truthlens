FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Run build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Runner stage
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src/lib/db/schema.sql ./src/lib/db/schema.sql

# Create storage and data directory with proper permissions
RUN mkdir -p /app/data /app/storage/uploads /app/storage/derivatives && \
    chown -R nextjs:nodejs /app/data /app/storage

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["npm", "start"]
