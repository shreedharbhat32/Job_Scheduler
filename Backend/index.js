import { app } from "./src/app.js";
import connectDB from "./src/db/index.js";
import dotenv from "dotenv";

dotenv.config({
    path: "./.env"
});

connectDB();

app.listen(process.env.PORT, () => {
    console.log("server running at port %s", process.env.PORT);
})