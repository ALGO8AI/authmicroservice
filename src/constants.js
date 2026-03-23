export const DB_NAME = "authbase";

export const UserRolesEnum = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  USER: "USER",
};

export const AvailableUserRoles = Object.values(UserRolesEnum);

export const UserLoginType = {
  GOOGLE: "GOOGLE",
  GITHUB: "GITHUB",
  EMAIL_PASSWORD: "EMAIL_PASSWORD",
};

export const USER_TEMPORARY_TOKEN_EXPIRY = 20 * 60 * 1000;
