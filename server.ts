import {app} from "./app"
import connectDB from './utilis/db'
require("dotenv").config();


//create server 
app.listen(process.env.PORT, ()=>{
    console.log(`server is runing `)
    connectDB();
});