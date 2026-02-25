# ---- build stage ----
    FROM node:20-alpine AS build
    WORKDIR /app
    
    COPY package*.json ./
    RUN npm ci
    
    COPY . .
    RUN npm run build
    
    # ---- run stage ----
    FROM nginx:alpine
    COPY --from=build /app/build /usr/share/nginx/html
    
    # React SPA routing (optional but recommended)
    RUN printf 'server {\n\
      listen 80;\n\
      server_name _;\n\
      root /usr/share/nginx/html;\n\
      index index.html;\n\
      location / {\n\
        try_files $uri $uri/ /index.html;\n\
      }\n\
    }\n' > /etc/nginx/conf.d/default.conf
    
    EXPOSE 80
    CMD ["nginx", "-g", "daemon off;"]