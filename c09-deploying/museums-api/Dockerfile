FROM hayd/alpine-deno:1.6.0
WORKDIR /app
COPY lock.json .
COPY src/deps.ts ./src/deps.ts
RUN deno cache --lock=lock.json --unstable ./src/deps.ts
COPY . .
CMD ["deno", "run", "--allow-net", "--unstable", "--allow-env", "--allow-read", "--allow-write", "--allow-plugin", "src/index.ts" ]
