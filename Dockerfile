FROM node:20-slim

# libreoffice turns office files into pdf
RUN apt-get update && apt-get install -y --no-install-recommends \
      libreoffice-writer libreoffice-calc libreoffice-impress \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# cache deps
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV PORT=5000
EXPOSE 5000

CMD ["node", "server.js"]
