#Create image based on the official Node image from dockerhub
FROM node:20

#Create app directory
WORKDIR /app

# Copy dependency definitions (package.json and package-lock.json)
COPY package*.json ./

# Install dependencies
RUN npm install

# Get all the code needed to run the app
COPY . .

# Expose the port the app runs in
EXPOSE 8080

# Serve the app
CMD ["node", "src/app.js"]


