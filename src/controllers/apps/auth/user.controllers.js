const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { ApiError } = require("../../../utils/ApiError.js");
const { ApiResponse } = require("../../../utils/ApiResponse.js");
const userQueries = require("../../../queries/apps/auth/auth.queries.js");
const {
    generateAccessToken,
    generateRefreshToken,
    generateHashPassword,
    isPasswordCorrect,
    generateTemporaryToken,
} = require("../../../utils/jwt.js");
const { Op } = require("sequelize");
const { forgotPasswordMailgenContent } = require("../../../utils/mailContentGen.js");
const sendEmail = require("../../../utils/mailConfig.js");

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await userQueries.findOne({
            where: { userId },
        });

        const accessToken = await generateAccessToken({
            userId: user.userId,
            email: user.email,
            roleId: user.roleId,
        });
        const refreshToken = await generateRefreshToken({
            userId: user.userId,
            email: user.email,
            roleId: user.roleId,
        });
        user.refreshToken = refreshToken;
        await user.save();
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, error.message);
    }
};

const registerUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const existedUser = await userQueries.findOne({ where: { email } });

        if (existedUser) {
            return res
                .status(409)
                .json(
                    new ApiError(
                        409,
                        "User with email or username already exists",
                        []
                    )
                );
        }

        const hashPassword = await generateHashPassword(password);
        req.body.password = hashPassword;
        const user = await userQueries.create(req.body);

        const createdUser = await userQueries.findById(user.userId, {
            attributes: {
                exclude: [
                    "password",
                    "pin",
                    "refreshToken",
                    "forgotPasswordToken",
                    "forgotPasswordExpiry",
                ],
            },
        });

        if (!createdUser) {
            return res
                .status(500)
                .json(
                    new ApiError(
                        500,
                        "Something went wrong while registering the user"
                    )
                );
        }

        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    { user: createdUser },
                    "Users registered successfully."
                )
            );
    } catch (error) {
        return res.status(500).json(new ApiError(500, error.message));
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!password && !email) {
            return res
                .status(400)
                .json(new ApiError(400, "Password or email is required"));
        }

        const user = await userQueries.findOne({ where: { email } });

        if (!user) {
            return res
                .status(404)
                .json(new ApiError(404, "User does not exist"));
        }

        // Compare the incoming password with hashed password
        const isPasswordValid = await isPasswordCorrect(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res
                .status(401)
                .json(new ApiError(401, "Invalid user credentials"));
        }

        const { accessToken, refreshToken } =
            await generateAccessAndRefreshTokens(user.userId);

        // get the user document ignoring the password and refreshToken field
        const loggedInUser = await userQueries.findById(user.userId, {
            attributes: {
                exclude: [
                    "password",
                    "pin",
                    "refreshToken",
                    "forgotPasswordToken",
                    "forgotPasswordExpiry",
                ],
            },
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken }, // send access and refresh token in response if client decides to save them by themselves
                "User logged in successfully"
            )
        );
    } catch (error) {
        return res.status(500).json(new ApiError(500, error.message));
    }
};

const logoutUser = async (req, res) => {
    try {
        await userQueries.findOneAndUpdate(
            { where: { userId: req.user.userId } },
            {
                refreshToken: null,
            }
        );
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "User logged out"));
    } catch (error) {
        return res.status(500).json(new ApiError(500, error.message));
    }
};

const refreshAccessToken = async (req, res) => {
    const incomingRefreshToken = req.body.refreshToken;
    if (!incomingRefreshToken) {
        return res.status(401).json(new ApiError(401, "Unauthorized request"));
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );
        const user = await userQueries.findById(decodedToken?.userId);
        if (!user) {
            return res
                .status(401)
                .json(new ApiError(401, "Invalid refresh token"));
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            // If token is valid but is used already
            return res
                .status(401)
                .json(new ApiError(401, "Refresh token is expired or used"));
        }

        const { accessToken, refreshToken: newRefreshToken } =
            await generateAccessAndRefreshTokens(user.userId);

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            );
    } catch (error) {
        return res.status(500).json(new ApiError(500, error.message));
    }
};

const forgotPasswordRequest = async (req, res) => {
    try {
        const { email } = req.body;

        // Get email from the client and check if user exists
        const user = await userQueries.findOne({ where: { email } });

        if (!user) {
            return res
                .status(404)
                .json(new ApiError(404, "User does not exists", []));
        }

        // Generate a temporary token
        const { unHashedToken, hashedToken, tokenExpiry } =
            await generateTemporaryToken();

        user.forgotPasswordToken = hashedToken;
        user.forgotPasswordExpiry = tokenExpiry;

        await user.save();

        // Send mail with the password reset link. It should be the link of the frontend url with token
        await sendEmail(
          [user?.email],
          "Password reset request",
          forgotPasswordMailgenContent(
            user.username,
            `${process.env.RESET_PASSWORD_REDIRECT_URL}/${unHashedToken}`
          )
        );
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "Password reset mail has been sent on your mail id"
                )
            );
    } catch (error) {
        return res.status(500).json(new ApiError(500, error.message));
    }
};

const resetForgottenPassword = async (req, res) => {
    try {
        const { resetToken } = req.params;
        const { newPassword } = req.body;

        // Create a hash of the incoming reset token

        let hashedToken = await crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        // See if user with hash similar to resetToken exists
        // If yes then check if token expiry is greater than current date

        const user = await userQueries.findOne({
            where: {
                forgotPasswordToken: hashedToken,
                // forgotPasswordExpiry: { [Op.gt]: new Date() }
            },
        });

        // If either of the one is false that means the token is invalid or expired
        if (!user) {
            return res
                .status(489)
                .json(new ApiError(489, "Token is invalid or expired"));
        }

        // if everything is ok and token id valid
        // reset the forgot password token and expiry
        user.forgotPasswordToken = null;
        user.forgotPasswordExpiry = null;

        // Set the provided password as the new password
        const hashPassword = await generateHashPassword(newPassword);
        user.password = hashPassword;

        await user.save();
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Password reset successfully"));
    } catch (error) {
        return res.status(500).json(new ApiError(500, error.message));
    }
};

const changeCurrentPassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        const user = await userQueries.findById(req.user?.userId);

        // check the old password
        const isPasswordValid = await isPasswordCorrect(
            oldPassword,
            user.password
        );

        if (!isPasswordValid) {
            return res
                .status(400)
                .json(new ApiError(400, "Invalid old password"));
        }

        // assign new password in plain text
        // We have a pre save method attached to user schema which automatically hashes the password whenever added/modified
        const hashPassword = await generateHashPassword(newPassword);
        user.password = hashPassword;
        await user.save();

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Password changed successfully"));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new ApiError(500, error.message));
    }
};

const getCurrentUser = async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.user, "Current user fetched successfully")
        );
};

const updateUserAvatar = async (req, res) => {
    // Check if user has uploaded an avatar
    if (!req.file?.filename) {
        throw new ApiError(400, "Avatar image is required");
    }

    // get avatar file system url and local path
    const avatarUrl = getStaticFilePath(req, req.file?.filename);
    const avatarLocalPath = getLocalPath(req.file?.filename);

    const user = await User.findById(req.user._id);

    let updatedUser = await User.findByIdAndUpdate(
        req.user._id,

        {
            $set: {
                // set the newly uploaded avatar
                avatar: {
                    url: avatarUrl,
                    localPath: avatarLocalPath,
                },
            },
        },
        { new: true }
    ).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
    );

    // remove the old avatar
    removeLocalFile(user.avatar.localPath);

    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, "Avatar updated successfully"));
};

module.exports = {
    changeCurrentPassword,
    forgotPasswordRequest,
    getCurrentUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
    resetForgottenPassword,
    updateUserAvatar,
};
