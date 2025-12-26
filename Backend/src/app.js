import express from "express";
import router from "./routes/jobs.routes.js";

const app = express();

 
app.get("/", (req, res) => {
    console.log("API hit");
    res.send("Welcome to Job schedule management System API");
});

app.use("/api",router);

export {app}
