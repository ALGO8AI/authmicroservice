import { body, param } from "express-validator";
import { AvailableUserRoles } from "../constants.js";

const passwordValidator = (field = "password") =>
  body(field)
    .notEmpty()
    .withMessage(`${field} is required`)
    .isLength({ min: 8 })
    .withMessage(`${field} must be at least 8 characters long`);

const emailValidator = (field = "email") =>
  body(field)
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email is invalid");

export const userRegisterValidator = () => {
  return [emailValidator(), passwordValidator()];
};

export const userLoginValidator = () => {
  return [
    body("email")
      .optional()
      .trim()
      .toLowerCase()
      .isEmail()
      .withMessage("Email is invalid"),
    body("username").optional().trim(),
    body("password").notEmpty().withMessage("Password is required"),
    body().custom((value, { req }) => {
      if (!req.body.email && !req.body.username) {
        throw new Error("Email or username is required");
      }
      return true;
    }),
  ];
};

export const userChangeCurrentPasswordValidator = () => {
  return [
    body("oldPassword").notEmpty().withMessage("Old password is required"),
    passwordValidator("newPassword"),
  ];
};

export const userForgotPasswordValidator = () => {
  return [emailValidator()];
};

export const userResetForgottenPasswordValidator = () => {
  return [passwordValidator("newPassword")];
};

export const userAssignRoleValidator = () => {
  return [
    body("role")
      .optional()
      .isIn(AvailableUserRoles)
      .withMessage("Invalid user role"),
  ];
};

export const userRefreshTokenValidator = () => {
  // The refresh token may arrive via httpOnly cookie (primary path) or request
  // body (API clients). Body field is therefore optional, but must be non-empty
  // when provided. The controller rejects the request if neither source has a token.
  return [
    body("refreshToken")
      .if(body("refreshToken").exists())
      .notEmpty()
      .withMessage("Refresh token is required"),
  ];
};

export const addNewUserValidator = () => {
  return [
    emailValidator(),
    passwordValidator(),
    body("firstName").trim().notEmpty().withMessage("First name is required"),
    body("roleId").notEmpty().withMessage("Role ID is required"),
  ];
};

export const userIdParamValidator = () => {
  return [param("userId").isUUID().withMessage("Invalid user ID")];
};
