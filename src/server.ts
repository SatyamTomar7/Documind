import express from "express";
import cors from "cors";
import helmet from "helmet";
import userRouter from "./routes/user.routes";
import authRouter from "./routes/auth.routes";
import documentRouter from "./routes/document.routes";
import conversationRouter from "./routes/conversation.routes"
import { notFound } from "./middleware/notfound.middleware";
import { errorHandler } from "./middleware/error.middleware";
import healthRouter from "./routes/health.routes";
import env from "./config/env";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigins.length > 0 ? env.corsOrigins : false,
    credentials: true,
  })
);
app.use(express.json());

app.use(healthRouter);
app.use(userRouter);
app.use(authRouter);
app.use(documentRouter);
app.use(conversationRouter);
app.use(notFound);
app.use(errorHandler);
app.listen(env.port, () => {
  console.log(`DocuMind server running on port ${env.port}`);
});