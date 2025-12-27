import {Job} from '../models/jobs.models.js';
import mongoose from 'mongoose';
import {JobExecution} from '../models/jobs.executions.js';
import scheduled from "../utils/cron.utils.js";

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

        if (job.status === 'ACTIVE' && job.schedule) {
            scheduled.start();
        }

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

const getLast5Executions = async (req, res) => {
  try {
    const jobId = req.headers.jobid;

    if (!jobId) {
      return res.status(400).json({
        message: "jobId is required as query parameter or header"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        message: "Invalid jobId format"
      });
    }

    const executions = await JobExecution.find({ jobId: new mongoose.Types.ObjectId(jobId) })
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

export {createJob, getLast5Executions };