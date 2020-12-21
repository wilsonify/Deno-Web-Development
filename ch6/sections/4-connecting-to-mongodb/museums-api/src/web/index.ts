import { MuseumController } from "../museums/index.ts";
import { Application, jwtMiddleware, Router } from "../deps.ts";
import { UserController } from "../users/types.ts";
import { Algorithm } from "../deps.ts";

interface CreateServerDependencies {
  configuration: {
    port: number;
    authorization: {
      key: string;
      algorithm: Algorithm;
    };
  };
  museum: MuseumController;
  user: UserController;
}

export async function createServer({
  configuration: {
    port,
    authorization,
  },
  museum,
  user,
}: CreateServerDependencies) {
  const app = new Application();

  app.use(async (ctx, next) => {
    await next();
    const rt = ctx.response.headers.get("X-Response-Time");
    console.log(`${ctx.request.method} ${ctx.request.url} - ${rt}`);
  });
  app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    ctx.response.headers.set("X-Response-Time", `${ms}ms`);
  });

  app.addEventListener("listen", (e) => {
    console.log(
      `Application running at http://${e.hostname || "localhost"}:${port}`,
    );
  });

  app.addEventListener("error", (e) => {
    console.log("An error occurred", e.message);
  });

  const apiRouter = new Router({ prefix: "/api" });

  const authenticated = jwtMiddleware(
    { algorithm: authorization.algorithm, key: authorization.key },
  );
  apiRouter.get("/museums", authenticated, async (ctx) => {
    ctx.response.body = {
      museums: await museum.getAll(),
    };
  });

  apiRouter.post("/users/register", async (ctx) => {
    const { username, password } = await ctx.request.body({ type: "json" })
      .value;

    if (!username && !password) {
      ctx.response.status = 400;

      return;
    }

    const createdUser = await user.register({ username, password });

    ctx.response.status = 201;
    ctx.response.body = { user: createdUser };
  });

  apiRouter.post("/login", async (ctx) => {
    const { username, password } = await ctx.request.body().value;
    try {
      const { user: loginUser, token } = await user.login(
        { username, password },
      );
      ctx.response.body = { user: loginUser, token };
      ctx.response.status = 201;
    } catch (e) {
      ctx.response.body = { message: e.message };
      ctx.response.status = 400;
    }
  });

  app.use(apiRouter.routes());
  app.use(apiRouter.allowedMethods());

  app.use((ctx) => {
    ctx.response.body = "Hello World!";
  });

  await app.listen({ port });
}
