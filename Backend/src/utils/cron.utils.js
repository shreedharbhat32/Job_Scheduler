import cron from 'node-cron';
import {Job} from '../models/jobs.models.js';
import {JobExecution} from '../models/jobs.executions.js';
import { alertOnJobFailure } from './alert.utils.js';

const executionQueue = [];
let runningExecutions = 0;
const MAX_CONCURRENT = 50;
const CACHE_TTL = 5000;

let jobsCache = {
    data: [],
    lastUpdate: 0
};

const lastExecutionTimes = new Map();
const jobIntervals = new Map();

const getInterval = (schedule) => {
    if (!schedule) return null;
    const match = schedule.match(/^\*\/(\d+)\s+/);
    if (match) {
        return parseInt(match[1], 10) * 1000;
    }
    return null;
};

const shouldJobRun = (job, currentTime) => {
    try {
        if (!job.schedule || !cron.validate(job.schedule)) {
            return false;
        }

        const jobId = job._id.toString();
        const now = currentTime.getTime();
        
        let interval = jobIntervals.get(jobId);
        if (!interval) {
            interval = getInterval(job.schedule);
            if (interval) {
                jobIntervals.set(jobId, interval);
            } else {
                interval = null;
            }
        }
        
        const lastRun = lastExecutionTimes.get(jobId);
        
        if (interval !== null) {
            if (lastRun === undefined) {
                return true;
            }
            const timeSinceLastRun = now - lastRun;
            return timeSinceLastRun >= (interval - 500);
        } else {
            if (lastRun === undefined) {
                return true;
            }
            const timeSinceLastRun = now - lastRun;
            if (timeSinceLastRun > 60000) {
                return true;
            }
            return timeSinceLastRun >= 1000;
        }
    } catch (error) {
        console.error(`Error checking schedule for job ${job._id}:`, error);
        return false;
    }
};

const executeJob = async (job) => {
    const scheduledTime = new Date();
    const actualStartTime = new Date();
    let status = 'FAILED';
    let responseCode = null;
    let durationMs = null;
    let errorMessage = null;

    try {
        if (job.api) {
            const startTime = Date.now();
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            
            try {
                const urlLower = job.api.toLowerCase();
                const httpMethod = urlLower.includes('/post') || urlLower.includes('post') ? 'POST' : 'GET';
                const response = await fetch(job.api, {
                    method: httpMethod,
                    signal: controller.signal,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    ...(httpMethod === 'POST' ? { body: JSON.stringify({}) } : {})
                });
                clearTimeout(timeoutId);
                durationMs = Date.now() - startTime;
                responseCode = response.status;
                status = response.status >= 200 && response.status < 300 ? 'SUCCESS' : 'FAILED';
            } catch (fetchError) {
                clearTimeout(timeoutId);
                throw fetchError;
            }
        } else {
            durationMs = 0;
            status = 'SUCCESS';
            responseCode = 200;
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            errorMessage = 'Request timeout';
        } else {
            errorMessage = error.message || 'Job execution failed';
        }
        status = 'FAILED';
    }

    setImmediate(async () => {
        try {
            const execution = await JobExecution.create({
                jobId: job._id,
                scheduledTime: scheduledTime,
                actualStartTime: actualStartTime,
                status: status,
                responseCode: responseCode,
                durationMs: durationMs,
                attempt: 1,
                errorMessage: errorMessage
            });

            await Job.findByIdAndUpdate(job._id, {
                lastRunAt: actualStartTime
            });

            if (status === 'FAILED') {
                await alertOnJobFailure(job, {
                    errorMessage: errorMessage,
                    responseCode: responseCode,
                    durationMs: durationMs,
                    scheduledTime: scheduledTime,
                    actualStartTime: actualStartTime
                });
            }
        } catch (error) {
            console.error('Error saving job execution:', error);
        }
    });
};

const processQueue = async () => {
    while (executionQueue.length > 0 && runningExecutions < MAX_CONCURRENT) {
        const job = executionQueue.shift();
        if (!job) break;
        
        runningExecutions++;
        const jobId = job._id.toString();
        const now = Date.now();
        
        if (lastExecutionTimes.has(jobId)) {
            const lastExec = lastExecutionTimes.get(jobId);
            if (now - lastExec < 1000) {
                runningExecutions--;
                continue;
            }
        }
        
        lastExecutionTimes.set(jobId, now);
        
        executeJob(job).finally(() => {
            runningExecutions--;
            if (lastExecutionTimes.size > 2000) {
                const cutoff = now - 300000;
                for (const [id, time] of lastExecutionTimes.entries()) {
                    if (time < cutoff) {
                        lastExecutionTimes.delete(id);
                        jobIntervals.delete(id);
                    }
                }
            }
        });
    }
};

const getActiveJobs = async () => {
    const now = Date.now();
    if (jobsCache.data.length > 0 && (now - jobsCache.lastUpdate) < CACHE_TTL) {
        return jobsCache.data;
    }
    
    try {
        const jobs = await Job.find({ status: 'ACTIVE' }).select('_id schedule api title status').lean();
        jobsCache = {
            data: jobs,
            lastUpdate: now
        };
        return jobs;
    } catch (error) {
        console.error('Error fetching active jobs:', error);
        return jobsCache.data;
    }
};

const scheduled = cron.schedule('* * * * * *', async () => {
    try {
        const currentTime = new Date();
        const activeJobs = await getActiveJobs();
        
        for (const job of activeJobs) {
            if (!job.schedule) continue;
            
            if (shouldJobRun(job, currentTime)) {
                const jobId = job._id.toString();
                const now = Date.now();
                
                if (!lastExecutionTimes.has(jobId) || (now - lastExecutionTimes.get(jobId)) >= 1000) {
                    const alreadyQueued = executionQueue.some(j => j._id.toString() === jobId);
                    if (!alreadyQueued) {
                        executionQueue.push(job);
                    }
                }
            }
        }
        
        await processQueue();
        
    } catch (error) {
        console.error('Error in scheduler:', error);
    }
}, {
    scheduled: false
});

export default scheduled;
