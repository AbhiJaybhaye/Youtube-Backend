import { 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    registerUser, 
    changePassword, 
    getCurrentUser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage  
} from "../controllers/user.controller.js";
import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 }, 
        { name: "coverImage", maxCount: 1 }]
    ), 
    registerUser);

router.route("/login").post(
    loginUser
);

router.route("/logout").post(
    verifyJWT,
    logoutUser 
);

router.route("/refresh-token").post(
    refreshAccessToken
);

router.route("/change-password").post(
    verifyJWT,
    changePassword
);

router.route("/current-user").get(
    verifyJWT,
    getCurrentUser
);

router.route("/update-account-details").patch(
    verifyJWT,
    updateAccountDetails
);

router.route("/update-user-avatar").patch(
    verifyJWT,
    upload.single("avatar"),
    updateUserAvatar
);

router.route("/update-user-cover-image").patch(
    verifyJWT,
    upload.single("coverImage"),
    updateUserCoverImage
);


export default router;