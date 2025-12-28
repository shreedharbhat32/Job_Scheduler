import express from "express";
import router from "./routes/jobs.routes.js";
import scheduled from "./utils/cron.utils.js";


const app = express();

app.use(express.json());
app.get("/", (req, res) => {
    console.log("API hit");
    res.send("Welcome to Job schedule management System API");
});

app.use("/api",router);

export {app}
