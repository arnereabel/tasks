FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create necessary directories
RUN mkdir -p data uploads

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
