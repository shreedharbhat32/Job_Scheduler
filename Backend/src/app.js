import express from "express";


const app = express();

 
app.get("/", (req, res) => {
    console.log("API hit");
    res.send("Welcome to Job schedule management System API");
});


export {app}
