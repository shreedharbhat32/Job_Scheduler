import {Job} from '../models/jobs.models.js';
import mongoose from 'mongoose';
import {JobExecution} from '../models/jobs.executions.js';

const createJob = (async (req, res) =>{
    try {
        console.log("Create job API hit");
        const {title,schedule,api,type,nextRunAt,lastRunAt,status} = req.body;

        const existingjob = await Job.findOne({title:title});
        if(existingjob){
            return res.send({
                status:401,
                message:"This job already exists!",
            })
        }

        const job = await Job.create({
            title,
            schedule,
            api,
            type,
            nextRunAt,
            lastRunAt,
            status
        })

        return res.status(201).json({
            message: "Job created successfully!",
            jobId: job._id,
            job: job
        });
    } catch (error) {
        console.error("Error creating job:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
})

const createJobExecution = async (req, res) => {
    try {
        console.log("Create job execution API hit");
        const { jobId, scheduledTime, actualStartTime, status, responseCode, durationMs, attempt, errorMessage } = req.body;

        if (!jobId) {
            return res.status(400).json({
                message: "jobId is required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(jobId)) {
            return res.status(400).json({
                message: "Invalid jobId format"
            });
        }

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                message: "Job not found"
            });
        }

        if (!scheduledTime || !actualStartTime || !status) {
            return res.status(400).json({
                message: "scheduledTime, actualStartTime, and status are required"
            });
        }

        if (!["SUCCESS", "FAILED", "PENDING"].includes(status)) {
            return res.status(400).json({
                message: "status must be one of: SUCCESS, FAILED, PENDING"
            });
        }

        const jobExecution = await JobExecution.create({
            jobId: jobId,
            scheduledTime: new Date(scheduledTime),
            actualStartTime: new Date(actualStartTime),
            status: status,
            responseCode: responseCode || null,
            durationMs: durationMs || null,
            attempt: attempt || 1,
            errorMessage: errorMessage || null
        });

        return res.status(201).json({
            message: "Job execution created successfully!",
            execution: jobExecution
        });
    } catch (error) {
        console.error("Error creating job execution:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

const getLast5Executions = async (req, res) => {
  try {
    const { jobId } = req.headers;

    const executions = await JobExecution.find({ jobId: jobId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('actualStartTime responseCode durationMs');

    const formattedExecutions = executions.map(exec => ({
      executionTimestamp: exec.actualStartTime,
      responseStatus: exec.responseCode,
      executionDuration: exec.durationMs
    }));

    return res.status(200).json({
      jobId,
      executions: formattedExecutions
    });

  } catch (error) {
    console.error("Error fetching executions:", error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

export {createJob, createJobExecution, getLast5Executions };