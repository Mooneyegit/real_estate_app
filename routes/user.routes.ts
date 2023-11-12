import Express from "express";
import {
  activateUser,
  loginUser,
  registerationUser,
  logoutUser,
  updateAccessToken,
} from "../controllers/user.controller";
import { isAutheticated} from "../middleware/auth"
const userRouter = Express.Router();

userRouter.post("/registeration", registerationUser);

userRouter.post("/activate-user", activateUser);

userRouter.post("/login", loginUser);

userRouter.get("/logout",isAutheticated,  logoutUser);

userRouter.get("/refreshtoken", updateAccessToken)

export default userRouter;
