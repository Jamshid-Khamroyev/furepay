import express from "express";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.route.ts";
import userRoutes from "./routes/user.route.ts";
import blogRoutes from './routes/blog.route.ts'
import noteRoutes from './routes/note.route.ts';
import paymentRoutes from './routes/payment.route.ts';

const app = express();
app.use(
  "/api/payment/webhook",
  express.raw({ type: "application/json" })
);

app.use(cors({
  origin: [
    "https://furepay.onrender.com",
    "http://169.58.221.22",
    "http://169.58.221.22:80",
    process.env.CLIENT_URL || "",
  ].filter(Boolean),
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

const publicPath = path.join(process.cwd(), "public");
app.use(express.static(publicPath));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/blog", blogRoutes)
app.use("/api/note", noteRoutes);
app.use("/api/payment", paymentRoutes);

app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});
export default app;