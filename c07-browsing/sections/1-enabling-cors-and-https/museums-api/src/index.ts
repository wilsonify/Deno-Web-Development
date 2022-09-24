import { Database, MongoClient } from "./deps.ts";
import { createServer } from "./web/index.ts";
import {
  Controller as MuseumController,
  Repository as MuseumRepository,
} from "./museums/index.ts";

import {
  Controller as UserController,
  Repository as UserRepository,
} from "./users/index.ts";
import { Algorithm, AuthRepository } from "./deps.ts";

const client = new MongoClient();
client.connectWithUri(
  "mongodb+srv://deno-api:Hdxmy68qbWCrRlqR@deno-cluster.wtit0.mongodb.net/?retryWrites=true&w=majority",
);
const db = client.database("getting-started-with-deno");

const museumRepository = new MuseumRepository();
const museumController = new MuseumController({ museumRepository });

const authConfiguration = {
  algorithm: "HS512" as Algorithm,
  key: "my-insecure-key",
  tokenExpirationInSeconds: 120,
};
const authRepository = new AuthRepository({
  configuration: authConfiguration,
});

const userRepository = new UserRepository({ storage: db });
const userController = new UserController({ userRepository, authRepository });

museumRepository.storage.set("1fbdd2a9-1b97-46e0-b450-62819e5772ff", {
  id: "1fbdd2a9-1b97-46e0-b450-62819e5772ff",
  name: "The Louvre",
  description:
    "The world’s largest art museum and a historic monument in Paris, France.",
  location: {
    lat: "48.860294",
    lng: "2.33862",
  },
});

createServer({
  configuration: {
    port: 8080,
    authorization: {
      key: authConfiguration.key,
      algorithm: authConfiguration.algorithm,
    },
    allowedOrigins: ["http://localhost:3000"],
    secure: true,
    certFile: "./certificate.pem",
    keyFile: "./key.pem",
  },
  museum: museumController,
  user: userController,
});
