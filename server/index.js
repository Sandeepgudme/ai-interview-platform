import dotenv from "dotenv";
dotenv.config();



import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDb from "./config/connectDb.js";

import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js";
import interviewRouter from "./routes/interview.route.js";
import paymentRouter from "./routes/payment.route.js";


// CREATE EXPRESS APP
const app = express();

// MIDDLEWARES
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// ROUTES
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/payment", paymentRouter);

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("Server Running");
});

// START SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  try {
    await connectDb();
    console.log(`Server running on port ${PORT}`);
  } catch (err) {
    console.log("Database connection failed:", err);
  }
});