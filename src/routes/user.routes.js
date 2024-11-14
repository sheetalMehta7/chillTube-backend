import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refershAccessToken,
  updateCurrentPassword
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refershAccessToken);
router.route("/update-password").post(verifyJWT, updateCurrentPassword)

export default router;
