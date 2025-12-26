import express from "express";


const app = express();

 
app.get("/", (req, res) => {
    console.log("API hit");
    res.send("Welcome to the Library  Management System API");
});


export {app}
