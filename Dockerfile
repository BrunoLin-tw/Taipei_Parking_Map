# Multi-stage Dockerfile — build with Node, serve with nginx
# Build stage
FROM node:18-alpine AS build
WORKDIR /app
# Install dependencies (use package*.json)
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Optional: pass GEMINI_API_KEY at build time (or ensure .env.local is present)
ARG GEMINI_API_KEY
RUN if [ -n "$GEMINI_API_KEY" ]; then echo "GEMINI_API_KEY=$GEMINI_API_KEY" > .env.local; fi

# Build the app
RUN npm run build

# Production stage (nginx)
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Copy nginx config to enable SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]