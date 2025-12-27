import cron from 'node-cron';
import {Job } from '../models/jobs.models.js';
import {JobExecution} from '../models/jobs.executions.js';

const activeSchedules = new Map();

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

    try {
        await JobExecution.create({
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
    } catch (error) {
        console.error('Error saving job execution:', error);
    }
};

const scheduled = cron.schedule('* * * * * *', async () => {
    try {
        const jobs = await Job.find({ status: 'ACTIVE' });
        
        jobs.forEach(job => {
            if (!job.schedule) return;
            
            const jobKey = job._id.toString();
            
            if (!activeSchedules.has(jobKey)) {
                const jobCron = cron.schedule(job.schedule, async () => {
                    const freshJob = await Job.findById(job._id);
                    if (freshJob && freshJob.status === 'ACTIVE') {
                        await executeJob(freshJob);
                    }
                }, {
                    scheduled: true
                });
                
                activeSchedules.set(jobKey, jobCron);
                jobCron.start();
            }
        });

        const activeJobIds = new Set(jobs.map(j => j._id.toString()));
        for (const [jobKey, jobCron] of activeSchedules.entries()) {
            if (!activeJobIds.has(jobKey)) {
                jobCron.stop();
                activeSchedules.delete(jobKey);
            }
        }
    } catch (error) {
        console.error('Error scheduling jobs:', error);
    }
});

export default scheduled;