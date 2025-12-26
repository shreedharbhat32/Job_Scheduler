import mongoose from "mongoose";

const jobexecutionSchema = new mongoose.Schema({
    _id:{
        type: ObjectId,
        required: true,
        unique:true
    } ,
    jobId: ObjectId,               // reference to jobs._id

    scheduledTime: Date,           
    actualStartTime: Date,         

    status: String,                // "SUCCESS" | "FAILED"
    responseCode:{
       type: Number,  
       required:true,     
    } ,
    durationMs: Number,            // execution time

    attempt: Number,               // retry count (for AT_LEAST_ONCE)

    errorMessage: String,          // failure reason (optional)

    createdAt: Date
    
})


export const JobExecution = mongoose.model("JobExecution",jobexecutionSchema);