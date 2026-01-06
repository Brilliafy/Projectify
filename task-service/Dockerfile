FROM node:alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies (including devDependencies for tsx)
# In production, you might want to build specifically, but this ensures compatibility
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the service port
EXPOSE 3003

# Run the application
CMD ["npx", "tsx", "src/index.ts"]
