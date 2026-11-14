# Build stage
FROM oven/bun:slim AS builder
ARG NEXT_PUBLIC_GA4_MEASUREMENT_ID
ARG GA4_API_SECRET
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_GA4_MEASUREMENT_ID=$NEXT_PUBLIC_GA4_MEASUREMENT_ID
ENV GA4_API_SECRET=$GA4_API_SECRET
WORKDIR /app

# Install dependencies
COPY bun.lock package.json ./
RUN bun install --frozen-lockfile

# Build the Next.js app
COPY next-env.d.ts next.config.js tsconfig.json ./
COPY app/ ./app/
COPY public/ ./public/
RUN bun run build

# Runtime stage
FROM oven/bun:slim  AS runner
ARG NEXT_PUBLIC_GA4_MEASUREMENT_ID
ARG GA4_API_SECRET
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_GA4_MEASUREMENT_ID=$NEXT_PUBLIC_GA4_MEASUREMENT_ID
ENV GA4_API_SECRET=$GA4_API_SECRET
WORKDIR /app

# Copy built app from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/bun.lock ./
COPY --from=builder /app/next.config.js ./

# Install production dependencies
RUN bun install --production

# Start production Next.js server
EXPOSE 3000
CMD ["bun", "run", "start"]