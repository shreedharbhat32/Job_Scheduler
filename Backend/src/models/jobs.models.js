import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
    title:{
        type: String,
    },
    schedule: {
        type:String,    
    },
    api: {
        type: String,     
    },
    type:{
        type: String,                 
    },
    nextRunAt:{
        type:Date,  
    },            
    lastRunAt:{
        type:Date, 
    },         
    status: {
        type:String,                // "ACTIVE" | "PAUSED" | "DELETED"
    },
   createdAt: Date,
   updatedAt: Date
    });


export const Job = mongoose.model("Job", jobSchema);