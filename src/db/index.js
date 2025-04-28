import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB = async () => {

    try {
        const db = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        console.log("✅ Database connected successfully,\nDB_HOST: ", db.connection.host);
        console.log("DB_NAME: ", db.connection.db.databaseName);
    } catch (error) {
        console.log("❌ Database connection error", error);
        process.exit(1);    
    }        
};

export default connectDB;