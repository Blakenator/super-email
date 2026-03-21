# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.18.2 --activate

# Copy workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY common/package.json ./common/
COPY backend/package.json ./backend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY common/ ./common/
COPY backend/ ./backend/

# Build common first, then backend
WORKDIR /app/common
RUN pnpm run build

WORKDIR /app/backend
RUN pnpm run build

# Production stage
FROM node:20-slim AS production

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.18.2 --activate

# Copy workspace configuration
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY common/package.json ./common/
COPY backend/package.json ./backend/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built files
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/common/dist ./common/dist
COPY --from=builder /app/common/schema.graphql ./common/

# Pre-download the embedding model (Xenova/all-MiniLM-L6-v2, ~25 MB) into the
# image cache so startup has no network download and no CPU spike from ONNX init.
RUN node -e "import('@huggingface/transformers').then(async({pipeline})=>{\
  console.log('Pre-caching Xenova/all-MiniLM-L6-v2...');\
  await pipeline('feature-extraction','Xenova/all-MiniLM-L6-v2',{dtype:'fp32'});\
  console.log('Model cached successfully');\
  process.exit(0);\
}).catch(e=>{console.error(e.message);process.exit(1);})"

# Set working directory to backend
WORKDIR /app/backend

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

# Start the application
CMD ["node", "dist/bootstrap.js"]
