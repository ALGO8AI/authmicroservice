const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

async function generateHashPassword(password) {
    return await bcrypt.hash(password, 10);
}

async function isPasswordCorrect(password, hashPassword) {
    return await bcrypt.compare(password, hashPassword);
}

async function generateAccessToken(details) {
    return jwt.sign(details, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    });
}

async function generateRefreshToken(details) {
    return jwt.sign(details, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    });
}

async function generateTemporaryToken() {
    const unHashedToken = crypto.randomBytes(20).toString("hex");
    const hashedToken = crypto
        .createHash("sha256")
        .update(unHashedToken)
        .digest("hex");

    const tokenExpiry = Date.now() + 20 * 60 * 1000;
    return { unHashedToken, hashedToken, tokenExpiry };
}

module.exports = {
    generateHashPassword,
    isPasswordCorrect,
    generateAccessToken,
    generateRefreshToken,
    generateTemporaryToken,
};
