import {Job} from './src/models/jobs.models.js';
import connectDB from "./src/db/index.js";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({
    path: "./.env"
});

const createjob = async()=>{
    try{
        await connectDB();
        
        await new Promise((resolve) => {
            if (mongoose.connection.readyState === 1) {
                resolve();
            } else {
                mongoose.connection.once('open', resolve);
            }
        });

        const jobs = [];

        for (let i = 1; i <= 1000; i++) {
            jobs.push({
                title: `test-job-${i}`,
                schedule: "*/10 * * * * *",
                api: "https://postman-echo.com/post",
                type: "AT_LEAST_ONCE",
                status: "ACTIVE"
            });
        }

        await Job.insertMany(jobs);

        console.log("✅ 1000 jobs created successfully");
        await mongoose.connection.close();
        process.exit(0);

    } catch (err) {
        console.error("❌ Error happened:", err);
        await mongoose.connection.close();
        process.exit(1);
    }
};

createjob();
export {createjob};