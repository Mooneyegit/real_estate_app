require("dotenv").config();
import { NextFunction, Response } from "express";
import { IUser } from "../models/userModels";
import { redis } from "./redis";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "./ErrorHandler";

interface ITokenOptions {
  expire: Date;
  maxAge: number;
  httpOnly: boolean;
  sameSite: "lax" | "strict" | "none" | undefined;
  secure?: Boolean;
}
 // parse enviroment variables to intergrate with fallback values
 export const accessTokenExpire = parseInt(
  process.env.ACCESS_TOKEN_EXPIRE || "300",
  10
);
export  const refreshTokenExpire = parseInt(
  process.env.REFRESH_TOKEN_EXPIRE || "1200",
  10
);

//options for cookies
export const accessTokenOptions: ITokenOptions = {
  expire: new Date(Date.now() + accessTokenExpire * 60 * 60 *1000),
  maxAge: accessTokenExpire *60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
};

 export const refreshTokenOptions: ITokenOptions = {
  expire: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 *1000),
  maxAge: refreshTokenExpire *24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
};

// Create a function that sets a cookie with specified options(expiremental module )
export const setCookieWithOptions = (res: Response, name: string, value: string, options: ITokenOptions) => {
    res.cookie(name, value, {
      expires: options.expire,
      maxAge: options.maxAge,
      httpOnly: options.httpOnly,
      sameSite: options.sameSite,
     // secure: options.secure || false, // Default to false if not provided
    });
  } 
  
export const sendToken = (user: IUser, statusCode: number, res: Response) => {
  const accessToken = user.SignAccessToken();
  const refreshToken = user.SignRefreshToken();

  //upload session to redis
  redis.set(user._id, JSON.stringify(user) as any )

 
  // only set secure to true in production
  if (process.env.NODE_ENV === "production") {
    accessTokenOptions.secure = true;
  }

  // res.cookie("access_token", accessToken, accessTokenOptions);
  // res.cookie("refresh_token", refreshToken, refreshTokenOptions);

 // Use the setCookieWithOptions function to set cookies with options (expiremental module )
  setCookieWithOptions(res, "access_token", accessToken, accessTokenOptions);
  setCookieWithOptions(res, "refresh_token", refreshToken, refreshTokenOptions);


  res.status(statusCode).json({
    success: true,
    user,
    accessToken,
  });
};

