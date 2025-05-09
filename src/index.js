import "dotenv/config";
import { app } from "./app.js";
import connectDB from "./db/index.js";

connectDB();

app.listen(process.env.PORT, () => {
  console.log(`🛢️  Server is running at http://localhost:${process.env.PORT}`);
});
