FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends patch \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY app.tar.gz /tmp/app.tar.gz
COPY regression.patch /tmp/regression.patch

RUN tar -xzf /tmp/app.tar.gz -C /app \
  && find . -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.json' -o -name '*.css' -o -name '*.html' -o -name '*.md' \) -print0 \
    | xargs -0 sed -i 's/\r$//' \
  && patch -p1 < /tmp/regression.patch \
  && rm -f /tmp/app.tar.gz /tmp/regression.patch

RUN npm ci

ENV NODE_ENV=development
