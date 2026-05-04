# Stage 1: Build the Flutter Web application
FROM ghcr.io/cirruslabs/flutter:3.19.0 AS build

WORKDIR /app/mobile

# Copy the pubspec files and install dependencies
COPY mobile/pubspec.* ./
RUN flutter pub get

# Copy the rest of the Flutter application code
COPY mobile ./

# Build the web application
RUN flutter create --platforms web .
RUN flutter build web --release

# Stage 2: Serve the application using Nginx
FROM nginx:alpine

# Copy the built assets from the build stage to Nginx
COPY --from=build /app/mobile/build/web /usr/share/nginx/html

# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
