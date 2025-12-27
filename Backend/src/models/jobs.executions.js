import mongoose from "mongoose";

const jobexecutionSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },

    scheduledTime: {
        type: Date,
        required: true
    },
    actualStartTime: {
        type: Date,
        required: true
    },

    status: {
        type: String,
        enum: ["SUCCESS", "FAILED", "PENDING"],
        required: true
    },
    responseCode: {
        type: Number,
        required: false
    },
    durationMs: {
        type: Number,
        required: false
    },

    attempt: {
        type: Number,
        default: 1
    },

    errorMessage: {
        type: String,
        required: false
    }
    
}, {
    timestamps: true
})


export const JobExecution = mongoose.model("JobExecution",jobexecutionSchema);