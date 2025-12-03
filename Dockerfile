# Node.js 18
FROM node:18

# Työhakemisto
WORKDIR /app

# Kopioi package.json ja package-lock.json
COPY package*.json ./

# Asenna riippuvuudet
RUN npm install

# Kopioi muu sovelluskoodi
COPY . .

# Palvelimen portti
EXPOSE 3000

# Käynnistä palvelin
CMD ["node", "server.js"]

