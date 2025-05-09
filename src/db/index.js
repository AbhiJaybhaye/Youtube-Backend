import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB = async () => {

    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        console.log("✅ Database connected successfully");
    } catch (error) {
        console.log("❌ Database connection error", error);
        process.exit(1);    
    }        
};

export default connectDB;