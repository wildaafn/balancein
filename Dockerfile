FROM node:20-slim AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .

FROM node:20-slim
RUN groupadd -r appuser && useradd -r -g appuser appuser
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /usr/src/app/server.js ./
COPY --from=builder /usr/src/app/public ./public
USER appuser
EXPOSE 8080
CMD ["node", "server.js"]
