FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
RUN apk add --no-cache gettext
RUN rm -f /etc/nginx/conf.d/default.conf /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/nginx.conf.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
COPY --from=build /app/dist/my-angular-app/browser /usr/share/nginx/html
ENV PORT=8080
EXPOSE 8080
CMD ["/entrypoint.sh"]
