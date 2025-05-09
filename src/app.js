import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
  path: process.env.CLIENT_URL,
  credentials: true
}));

app.use(express.json({ 
  extended: true, 
  limit: "1mb" 
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: "1mb" 
}));

app.use(cookieParser({
  httpOnly: true,
  secure: true
}));

app.use(express.static("public"));


import userRouter from "./routes/user.route.js";

app.use("/api/v1/users", userRouter);


app.get("/", (req, res) => {
  res.send("<h1>Welcome to HOME route</h1>");
});

export { app };
