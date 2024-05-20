# Use a lightweight Node.js base image
FROM node:16-alpine

# Set the working directory
WORKDIR /app

# Copy the package.json file
COPY package*.json ./

# Install dependencies
RUN echo "Installing dependencies..." && npm install

# Copy the application code
COPY . .

# Expose the port the application will listen on
EXPOSE 3000

# Start the application
#CMD [ "npm", "start" ]
# Define the command to run your app
CMD ["node", "src/server.js"]
