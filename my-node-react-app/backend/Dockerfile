# Use official Node.js Alpine base image for smaller footprint
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Set environment to production
ENV NODE_ENV=production

# Install dependencies first for Docker caching
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose the API port
EXPOSE 5000

# Start gracefully using Node natively (don't wrap in npm scripts for production signals)
CMD ["node", "src/index.js"]
