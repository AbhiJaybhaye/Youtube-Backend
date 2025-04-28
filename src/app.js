import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("<h1>Welcome to HOME route</h1>");
});

export { app };
