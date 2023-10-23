import ErrorHandler from "../utilis/ErrorHandler";
import {Response, Request, NextFunction} from 'express'

export const ErrorMiddleware = (err:any,req:Request, res:Response, next:NextFunction) =>{
  err.statusCode = err.statusCode || 500
  err.message = err.message || "internal server error"

  //wrong mongodb id
  if(err.name == 'castError'){
    const message = `resourse not found, Invalid : ${err.path}`;
    err=new ErrorHandler(message,400)
  }
  //duplicate error
  if(err.code === 11000){
     const message = `Duplicate ${Object.keys(err.keyvalue)} entered `
     err = new ErrorHandler(message, 400)
  }
  //wrong jwt error 
  if(err.name == 'jsonWebError'){
    const message = 'json web token is invalid, try again ';
    err = new ErrorHandler(message,400);
  }
  // jwt expire 
  if(err.name == 'jsonExpireError'){
    const message = 'json web token is Expired, try again ';
    err = new ErrorHandler(message,400);
  }
  res.status(err.statusCode).json({
    success:false,
    message:err.message
  })
}