import Router from 'express';
import { createJob,  getLast5Executions } from '../controllers/jobs.controller.js';

const router = Router();

router.post('/create-job',createJob);
router.get('/getjob-executions',getLast5Executions);


export default router;