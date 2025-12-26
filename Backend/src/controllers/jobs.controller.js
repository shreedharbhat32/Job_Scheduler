import {Job} from '../models/jobs.models.js';


const createJob = (async (req, res) =>{
    console.log("Create job API hit");
    const {title,schedule,api,type,nextRunAt,lastRunAt,status} = req.body;

    const existingjob = await Job.findOne({title:title});
    if(existingjob){
        return res.send({
            status:401,
            message:"This job already exists!",
        })
    }

    const job = Job.create({
        title,
        schedule,
        api,
        type,
        nextRunAt,
        lastRunAt,
        status
    })
    return res.status(201).json({message:"Job created succesfully!"},job);
})


export {createJob};