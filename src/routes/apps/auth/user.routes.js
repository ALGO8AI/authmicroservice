const { Router } = require("express");
const passport = require("passport");
// const { UserRolesEnum } = require("../../../constants.js");
const {
    // assignRole,
    // changeCurrentPassword,
    // forgotPasswordRequest,
    getCurrentUser,
    handleSocialLogin,
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
    // resendEmailVerification,
    // resetForgottenPassword,
    // updateUserAvatar,
    // verifyEmail,
} = require("../../../controllers/apps/auth/user.controllers.js");
const {
    verifyJWT,
    verifyPermission,
} = require("../../../middlewares/auth.middlewares.js");

require("../../../passport/index.js"); // const the passport config
const {
    userAssignRoleValidator,
    userChangeCurrentPasswordValidator,
    userForgotPasswordValidator,
    userLoginValidator,
    userRegisterValidator,
    userResetForgottenPasswordValidator,
} = require("../../../validators/apps/auth/user.validators.js");
const { validate } = require("../../../validators/validate.js");
// const { upload } = require("../../../middlewares/multer.middlewares.js");
const {
    mongoIdPathVariableValidator,
} = require("../../../validators/common/mongodb.validators.js");

const router = Router();

// Unsecured route
router.route("/register").post(userRegisterValidator(), validate, registerUser);
router.route("/login").post(userLoginValidator(), validate, loginUser);
router.route("/refresh-token").post(refreshAccessToken);
// router.route("/verify-email/:verificationToken").get(verifyEmail);

// router
//     .route("/forgot-password")
//     .post(userForgotPasswordValidator(), validate, forgotPasswordRequest);
// router
//     .route("/reset-password/:resetToken")
//     .post(
//         userResetForgottenPasswordValidator(),
//         validate,
//         resetForgottenPassword
//     );

// // Secured routes
router.route("/logout").post(verifyJWT, logoutUser);
// router
//     .route("/avatar")
//     .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/current-user").get(verifyJWT, getCurrentUser);
// router
//     .route("/change-password")
//     .post(
//         verifyJWT,
//         userChangeCurrentPasswordValidator(),
//         validate,
//         changeCurrentPassword
//     );
// router
//     .route("/resend-email-verification")
//     .post(verifyJWT, resendEmailVerification);
// router
//     .route("/assign-role/:userId")
//     .post(
//         verifyJWT,
//         verifyPermission([UserRolesEnum.ADMIN]),
//         mongoIdPathVariableValidator("userId"),
//         userAssignRoleValidator(),
//         validate,
//         assignRole
//     );

// SSO routes
router.route("/google").get(
    passport.authenticate("google", {
        scope: ["profile", "email"],
    }),
    (req, res) => {
        res.send("redirecting to google...");
    }
);

// router.route("/github").get(
//     passport.authenticate("github", {
//         scope: ["profile", "email"],
//     }),
//     (req, res) => {
//         res.send("redirecting to github...");
//     }
// );

router
    .route("/google/callback")
    .get(passport.authenticate("google"), handleSocialLogin);

// router
//     .route("/github/callback")
//     .get(passport.authenticate("github"), handleSocialLogin);

module.exports = router;
