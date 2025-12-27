import {JobExecution} from '../models/jobs.executions.js';

const alertOnJobFailure = async (job, executionDetails) => {
    try {
        const alertMessage = {
            timestamp: new Date().toISOString(),
            severity: 'ERROR',
            jobId: job._id.toString(),
            jobTitle: job.title,
            jobApi: job.api,
            failureReason: executionDetails.errorMessage || `HTTP ${executionDetails.responseCode}`,
            responseCode: executionDetails.responseCode,
            executionDuration: executionDetails.durationMs,
            scheduledTime: executionDetails.scheduledTime,
            actualStartTime: executionDetails.actualStartTime
        };

        console.error('🚨 JOB FAILURE ALERT:', JSON.stringify(alertMessage, null, 2));

        const recentFailures = await getRecentFailureCount(job._id, 5);
        if (recentFailures >= 3) {
            console.error(`⚠️ CRITICAL: Job "${job.title}" has failed ${recentFailures} times in recent executions!`);
        }

    } catch (error) {
        console.error('Error sending job failure alert:', error);
    }
};

const getRecentFailureCount = async (jobId, limit = 5) => {
    try {
        const recentExecutions = await JobExecution.find({ jobId })
            .sort({ createdAt: -1 })
            .limit(limit);
        
        return recentExecutions.filter(exec => exec.status === 'FAILED').length;
    } catch (error) {
        return 0;
    }
};

export { alertOnJobFailure };
