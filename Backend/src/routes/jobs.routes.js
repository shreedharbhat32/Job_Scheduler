import Router from 'express';
import { createJob } from '../controllers/jobs.controller.js';

const router = Router();

router.post('/create-job',createJob);



export default router;