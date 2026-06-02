import mongoose from "mongoose";
const connectDb = async () => {
  try {
    console.log("MONGODB_URL =", process.env.MONGODB_URL);
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Database connected");
  } catch (error) {
    console.log(`Database Error: ${error}`);
  }
};
export default connectDb;