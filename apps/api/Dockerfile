FROM node:18-alpine

WORKDIR /app

# Install dependencies for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/ ./packages/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client
RUN cd apps/api && npx prisma generate

# Build the application
RUN npm run build --workspace=@elektronik/api

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start", "--workspace=@elektronik/api"]
