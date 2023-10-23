import Express from "express";
import {
  activateUser,
  loginUser,
  registerationUser,
} from "../controllers/user.controller";
const userRouter = Express.Router();

userRouter.post("/registeration", registerationUser);

userRouter.post("/activate-user", activateUser);

userRouter.get("/login", loginUser);

export default userRouter;
