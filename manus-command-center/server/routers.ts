import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { chatRouter } from "./routers/chat";
import { commandCenterRouter } from "./routers/commandCenter";
import { agentRouter, projectRouter } from "./routers/projects";
import { contentRouter, mediaRouter, videoRouter } from "./routers/media";
import { githubRouter } from "./routers/github";
import { marketRouter } from "./routers/market";
import { scheduleRouter, workflowRouter } from "./routers/workflows";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  commandCenter: commandCenterRouter,
  projects: projectRouter,
  agents: agentRouter,
  chat: chatRouter,
  workflows: workflowRouter,
  schedules: scheduleRouter,
  content: contentRouter,
  media: mediaRouter,
  video: videoRouter,
  github: githubRouter,
  market: marketRouter,
});

export type AppRouter = typeof appRouter;
