FROM node:20-slim

# Install system-wide Chromium browser and fonts
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Optimize container size by skipping downloaded Puppeteer browser binaries
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

# Copy package list and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source files
COPY . .

# Compile Next.js production bundle with build-time MONGODB_URI configuration
ENV MONGODB_URI=mongodb+srv://dreamflyholiday:gcVHWrg2pzDDpYBt@cluster0.bniqctr.mongodb.net/?appName=Cluster0
RUN npm run build

# Expose ports for Next.js (3000) and Express (5001)
EXPOSE 3000
EXPOSE 5001

# Start script
CMD ["npm", "run", "start"]
