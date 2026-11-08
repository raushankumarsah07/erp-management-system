import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(
      `[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`,
    );
  } catch (error) {
    console.error(`[Database Error] ${error.message}`);
    console.warn(
      "[Database] Note: Ensure local MongoDB service is running on 127.0.0.1:27017",
    );
    // If running in development without live Mongo instance yet, we log without crashing hard
  }
};
