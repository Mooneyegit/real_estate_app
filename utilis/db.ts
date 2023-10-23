import { connect } from "http2";
import mongoose from "mongoose";
require('dotenv').config();

const dbUrl:string = process.env.DB_URI || '';

const connectDB = async () =>{
    try {
        await mongoose.connect(dbUrl).then((data:any)=>{
           console.log('database connected')
        })
    } catch (error:any) {
        console.log(error.message);
        setTimeout(connectDB, 5000)
    }
}

export default connectDB ;