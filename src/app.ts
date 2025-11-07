import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import googleAuthRouter from "./routes/googleAuth";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/auth", googleAuthRouter);

export default app;
