import Router from 'express';
import { createJob, createJobExecution, getLast5Executions } from '../controllers/jobs.controller.js';

const router = Router();

router.post('/create-job',createJob);
router.post('/create-job-execution',createJobExecution);
router.get('/getjob-executions',getLast5Executions);


export default router;