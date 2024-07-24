const DB_NAME = "authbase";

const UserRolesEnum = {
    ADMIN: "ADMIN",
    USER: "USER",
};

const AvailableUserRoles = Object.values(UserRolesEnum);

const UserLoginType = {
    GOOGLE: "GOOGLE",
    GITHUB: "GITHUB",
    EMAIL_PASSWORD: "EMAIL_PASSWORD",
};

const USER_TEMPORARY_TOKEN_EXPIRY = 20 * 60 * 1000;

module.exports = {
    DB_NAME,
    UserRolesEnum,
    AvailableUserRoles,
    UserLoginType,
    USER_TEMPORARY_TOKEN_EXPIRY
}
