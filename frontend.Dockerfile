# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY ./frontend/package*.json ./
RUN npm ci

# Copy the rest of the frontend source
COPY ./frontend/ ./

# Build the Vite React app
RUN npm run build

# Serve stage
FROM nginx:alpine

# Copy the built assets to NGINX
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration if needed (using default for now)
# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
