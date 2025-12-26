import mongoose from "mongoose";

const connectDB = async()=>{
    try {
        const connect = await mongoose.connect(`${process.env.MONGOOSE_URI}/${process.env.DB_NAME}`);
        console.log("Database connected successfully");
    }catch(error){
        console.log("Error connecting database",error);
    }
};

export default connectDB;