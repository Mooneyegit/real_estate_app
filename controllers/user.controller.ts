require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/userModels";
import ErrorHandler from "../utilis/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import sendMail from "../utilis/sendMail";
import { sendToken } from "../utilis/jwt";
import { redis } from "../utilis/redis";

//register user
interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export const registerationUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body;

      const isEmailExist = await userModel.findOne({ email });
      if (isEmailExist) {
        return next(new ErrorHandler("Email already exist", 400));
      }

      const user: IRegistrationBody = {
        name,
        email,
        password,
      };

      const activationToken = createActivationToken(user);
      const activationCode = activationToken.activationCode;
      const data = { user: { name: user.name }, activationCode };
      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/activation-mail.ejs"),
        data
      );
      try {
        await sendMail({
          email: user.email,
          subject: "Activate your account",
          template: "activation-mail.ejs",
          data,
        });
        res.status(201).json({
          success: true,
          message: `Please check your email : ${user.email} to activate your account!`,
          activationToken: activationToken.token,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

interface IActivationToken {
  token: String;
  activationCode: String;
}

export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.ACTIVATION_SECRET as Secret,
    {
      expiresIn: "5m",
    }
  );
  return { token, activationCode };
};
//

// activate user
interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

export const activateUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token, activation_code } =
        req.body as IActivationRequest;
      //const decoded = jwt.verify(activation_token,process.env.ACTIVATION_SECRET as secret) as {user:IRegistrationBody, activationCode:string};

      const newUser: { user: IUser; activationCode: string } = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as string
      ) as { user: IUser; activationCode: string };

      if (newUser.activationCode != activation_code) {
        return next(new ErrorHandler("Invalid activation code", 400));
      }

      const { name, email, password } = newUser.user;

      const existUser = await userModel.findOne({ email });

      if (existUser) {
        return next(new ErrorHandler("user already exist", 400));
      }

      const user = await userModel.create({
        name,
        email,
        password,
      });

      res.status(201).json({
        success: true,
        message: "user created successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Login user

interface ILoginRequest {
    email: string;
    password : string;
}


export const loginUser = CatchAsyncError(  async(req:Request,res:Response,next:NextFunction) =>{
    try {
        const {email,password} = req.body as ILoginRequest;

        if(!email || !password){
            return next(new ErrorHandler("please enter your email and password", 400))
        }
        
        const user = await userModel.findOne({email}).select("password");
        if(!user){
            return next(new ErrorHandler("Invalid email or password ",400))
        }
        const isPasswordMatch = await user.comparePasssword(password) 

        if(!isPasswordMatch){
            return next(new ErrorHandler("You enter an invalid password or an invalid email for the  password ",400))
        }
        sendToken(user, 200, res);
 
        
    } catch (error:any) {
        return next(new ErrorHandler(error.message, 400)); 
    }
})

// logour user 
export const logoutUser = CatchAsyncError( async (req:Request, res:Response, next:NextFunction) => {
  try {
    res.cookie("access_token", "",{maxAge: 1}); 
    res.cookie("refresh_token", "",{maxAge:1});
    
    const userId= req.user?._id || "";
    redis.del(userId);

    res.status(200).json({success:true, message: "User logged out successfully"})
  } catch (error:any) {
    return next(new ErrorHandler(error.message, 400));
  }
});


//update access token 
export const updateAccessToken =CatchAsyncError( async (req:Request, res:Response, next:NextFunction) => {
  try {
      const refresh_token = req.cookies.refresh_token as string;
      const decoded = jwt.verify(refresh_token,
        process.env.REFRESH_TOKEN as string ) as JwtPayload;

        const message = 'could not refresh token'
        if(!decoded){
          return next(new ErrorHandler(message, 400));
        }
        const session = await redis.get(decoded.id as string);
        if(!session){
          return next(new ErrorHandler(message,400))
        }
        const user = JSON.parse(session);

        const accessToken = jwt.sign({id:user._id}, process.env.ACCESS_TOKEN as string,{
          expiresIn:"5m",
        })
        const refreshToken = jwt.sign({id:user._id}, process.env.REFRESH_TOKEN as string,{
          expiresIn:"3d"
        })
  } catch (error:any) {
    return next(new ErrorHandler(error.message, 400));
  }
})
