import { Router } from "express";
import { reegisterUser,loginUser, logoutUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router =Router()

router.route("/resister").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    reegisterUser
)


router.route("/login").post(loginUser)

//secure route
router.route("/logout").post(verifyJWT,logoutUser)

export default router;