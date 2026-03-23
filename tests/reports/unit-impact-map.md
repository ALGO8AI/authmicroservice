# Unit Dependency Impact Map

## In Scope

### src/controllers/auth.controller.js

Exported functions: registerUser, loginUser, logoutUser, refreshAccessToken, forgotPasswordRequest, verifyUserByOtp, changeCurrentPassword, getCurrentUser, addNewUser, editUserDetails, deleteUser, getAllUsers
Direct dependencies: src/services/auth.service.js, src/utils/ApiError.js, src/utils/ApiResponse.js, src/utils/asyncHandler.js

### src/controllers/healthcheck.controller.js

Exported functions: healthcheck
Direct dependencies: module, src/config/db.js, src/utils/ApiResponse.js, src/utils/asyncHandler.js

### src/controllers/oauth.controller.js

Exported functions: googleRedirect, googleCallback, googleFailed, googleSuccess
Direct dependencies: crypto, src/services/auth.service.js, src/utils/ApiError.js, src/utils/ApiResponse.js, src/utils/asyncHandler.js

### src/controllers/upload.controller.js

Exported functions: uploadFile
Direct dependencies: src/logger/winston.logger.js, src/utils/ApiError.js, src/utils/ApiResponse.js

### src/services/auth.service.js

Exported functions: registerUser, loginUser, logoutUser, refreshAccessToken, forgotPasswordRequest, verifyUserByOtp, changeCurrentPassword, addNewUser, editUserDetails, deleteUser, findOrCreateGoogleUser, getAllUsers
Direct dependencies: bcrypt, crypto, jsonwebtoken, src/constants.js, src/logger/winston.logger.js, src/queries/auth.queries.js, src/utils/ApiError.js, src/utils/jwt.js, src/utils/mail.js, src/utils/otp.js, src/utils/password.js

### src/utils/ApiError.js

Exported functions: ApiError
Direct dependencies: None

### src/utils/ApiResponse.js

Exported functions: ApiResponse
Direct dependencies: None

### src/utils/asyncHandler.js

Exported functions: asyncHandler
Direct dependencies: None

### src/utils/jwt.js

Exported functions: generateAccessToken, generateRefreshToken, generateTemporaryToken
Direct dependencies: jsonwebtoken

### src/utils/mail.js

Exported functions: forgotPasswordOtpMailgenContent, newUserRegisterMailgen, sendEmail
Direct dependencies: fs, mailgen, nodemailer, path, src/logger/winston.logger.js

### src/utils/otp.js

Exported functions: generateOtp, verifyOtp
Direct dependencies: bcrypt, crypto

### src/utils/password.js

Exported functions: generateHashPassword, isPasswordCorrect
Direct dependencies: bcrypt

### src/validators/auth.validators.js

Exported functions: userRegisterValidator, userLoginValidator, userChangeCurrentPasswordValidator, userForgotPasswordValidator, verifyUserByOtpValidator, userAssignRoleValidator, userRefreshTokenValidator, addNewUserValidator, userIdParamValidator
Direct dependencies: express-validator, src/constants.js

### src/validators/validate.js

Exported functions: validate
Direct dependencies: express-validator, src/utils/ApiError.js

### src/middlewares/auth.middlewares.js

Exported functions: verifyJWT, verifyPermission
Direct dependencies: jsonwebtoken, src/queries/auth.queries.js, src/utils/ApiError.js

### src/middlewares/error.middlewares.js

Exported functions: errorHandler
Direct dependencies: sequelize, src/logger/winston.logger.js, src/utils/ApiError.js

### src/middlewares/requestId.middleware.js

Exported functions: requestId
Direct dependencies: crypto

## Dependency To Source Impact

### bcrypt

- src/services/auth.service.js#addNewUser
- src/services/auth.service.js#changeCurrentPassword
- src/services/auth.service.js#deleteUser
- src/services/auth.service.js#editUserDetails
- src/services/auth.service.js#findOrCreateGoogleUser
- src/services/auth.service.js#forgotPasswordRequest
- src/services/auth.service.js#getAllUsers
- src/services/auth.service.js#loginUser
- src/services/auth.service.js#logoutUser
- src/services/auth.service.js#refreshAccessToken
- src/services/auth.service.js#registerUser
- src/services/auth.service.js#verifyUserByOtp
- src/utils/otp.js#generateOtp
- src/utils/otp.js#verifyOtp
- src/utils/password.js#generateHashPassword
- src/utils/password.js#isPasswordCorrect

### crypto

- src/controllers/oauth.controller.js#googleCallback
- src/controllers/oauth.controller.js#googleFailed
- src/controllers/oauth.controller.js#googleRedirect
- src/controllers/oauth.controller.js#googleSuccess
- src/middlewares/requestId.middleware.js#requestId
- src/services/auth.service.js#addNewUser
- src/services/auth.service.js#changeCurrentPassword
- src/services/auth.service.js#deleteUser
- src/services/auth.service.js#editUserDetails
- src/services/auth.service.js#findOrCreateGoogleUser
- src/services/auth.service.js#forgotPasswordRequest
- src/services/auth.service.js#getAllUsers
- src/services/auth.service.js#loginUser
- src/services/auth.service.js#logoutUser
- src/services/auth.service.js#refreshAccessToken
- src/services/auth.service.js#registerUser
- src/services/auth.service.js#verifyUserByOtp
- src/utils/otp.js#generateOtp
- src/utils/otp.js#verifyOtp

### express-validator

- src/validators/auth.validators.js#addNewUserValidator
- src/validators/auth.validators.js#userAssignRoleValidator
- src/validators/auth.validators.js#userChangeCurrentPasswordValidator
- src/validators/auth.validators.js#userForgotPasswordValidator
- src/validators/auth.validators.js#userIdParamValidator
- src/validators/auth.validators.js#userLoginValidator
- src/validators/auth.validators.js#userRefreshTokenValidator
- src/validators/auth.validators.js#userRegisterValidator
- src/validators/auth.validators.js#verifyUserByOtpValidator
- src/validators/validate.js#validate

### fs

- src/utils/mail.js#forgotPasswordOtpMailgenContent
- src/utils/mail.js#newUserRegisterMailgen
- src/utils/mail.js#sendEmail

### jsonwebtoken

- src/middlewares/auth.middlewares.js#verifyJWT
- src/middlewares/auth.middlewares.js#verifyPermission
- src/services/auth.service.js#addNewUser
- src/services/auth.service.js#changeCurrentPassword
- src/services/auth.service.js#deleteUser
- src/services/auth.service.js#editUserDetails
- src/services/auth.service.js#findOrCreateGoogleUser
- src/services/auth.service.js#forgotPasswordRequest
- src/services/auth.service.js#getAllUsers
- src/services/auth.service.js#loginUser
- src/services/auth.service.js#logoutUser
- src/services/auth.service.js#refreshAccessToken
- src/services/auth.service.js#registerUser
- src/services/auth.service.js#verifyUserByOtp
- src/utils/jwt.js#generateAccessToken
- src/utils/jwt.js#generateRefreshToken
- src/utils/jwt.js#generateTemporaryToken

### mailgen

- src/utils/mail.js#forgotPasswordOtpMailgenContent
- src/utils/mail.js#newUserRegisterMailgen
- src/utils/mail.js#sendEmail

### module

- src/controllers/healthcheck.controller.js#healthcheck

### nodemailer

- src/utils/mail.js#forgotPasswordOtpMailgenContent
- src/utils/mail.js#newUserRegisterMailgen
- src/utils/mail.js#sendEmail

### path

- src/utils/mail.js#forgotPasswordOtpMailgenContent
- src/utils/mail.js#newUserRegisterMailgen
- src/utils/mail.js#sendEmail

### sequelize

- src/middlewares/error.middlewares.js#errorHandler

### src/config/db.js

- src/controllers/healthcheck.controller.js#healthcheck

### src/constants.js

- src/services/auth.service.js#addNewUser
- src/services/auth.service.js#changeCurrentPassword
- src/services/auth.service.js#deleteUser
- src/services/auth.service.js#editUserDetails
- src/services/auth.service.js#findOrCreateGoogleUser
- src/services/auth.service.js#forgotPasswordRequest
- src/services/auth.service.js#getAllUsers
- src/services/auth.service.js#loginUser
- src/services/auth.service.js#logoutUser
- src/services/auth.service.js#refreshAccessToken
- src/services/auth.service.js#registerUser
- src/services/auth.service.js#verifyUserByOtp
- src/validators/auth.validators.js#addNewUserValidator
- src/validators/auth.validators.js#userAssignRoleValidator
- src/validators/auth.validators.js#userChangeCurrentPasswordValidator
- src/validators/auth.validators.js#userForgotPasswordValidator
- src/validators/auth.validators.js#userIdParamValidator
- src/validators/auth.validators.js#userLoginValidator
- src/validators/auth.validators.js#userRefreshTokenValidator
- src/validators/auth.validators.js#userRegisterValidator
- src/validators/auth.validators.js#verifyUserByOtpValidator

### src/logger/winston.logger.js

- src/controllers/upload.controller.js#uploadFile
- src/middlewares/error.middlewares.js#errorHandler
- src/services/auth.service.js#addNewUser
- src/services/auth.service.js#changeCurrentPassword
- src/services/auth.service.js#deleteUser
- src/services/auth.service.js#editUserDetails
- src/services/auth.service.js#findOrCreateGoogleUser
- src/services/auth.service.js#forgotPasswordRequest
- src/services/auth.service.js#getAllUsers
- src/services/auth.service.js#loginUser
- src/services/auth.service.js#logoutUser
- src/services/auth.service.js#refreshAccessToken
- src/services/auth.service.js#registerUser
- src/services/auth.service.js#verifyUserByOtp
- src/utils/mail.js#forgotPasswordOtpMailgenContent
- src/utils/mail.js#newUserRegisterMailgen
- src/utils/mail.js#sendEmail

### src/queries/auth.queries.js

- src/middlewares/auth.middlewares.js#verifyJWT
- src/middlewares/auth.middlewares.js#verifyPermission
- src/services/auth.service.js#addNewUser
- src/services/auth.service.js#changeCurrentPassword
- src/services/auth.service.js#deleteUser
- src/services/auth.service.js#editUserDetails
- src/services/auth.service.js#findOrCreateGoogleUser
- src/services/auth.service.js#forgotPasswordRequest
- src/services/auth.service.js#getAllUsers
- src/services/auth.service.js#loginUser
- src/services/auth.service.js#logoutUser
- src/services/auth.service.js#refreshAccessToken
- src/services/auth.service.js#registerUser
- src/services/auth.service.js#verifyUserByOtp

### src/services/auth.service.js

- src/controllers/auth.controller.js#addNewUser
- src/controllers/auth.controller.js#changeCurrentPassword
- src/controllers/auth.controller.js#deleteUser
- src/controllers/auth.controller.js#editUserDetails
- src/controllers/auth.controller.js#forgotPasswordRequest
- src/controllers/auth.controller.js#getAllUsers
- src/controllers/auth.controller.js#getCurrentUser
- src/controllers/auth.controller.js#loginUser
- src/controllers/auth.controller.js#logoutUser
- src/controllers/auth.controller.js#refreshAccessToken
- src/controllers/auth.controller.js#registerUser
- src/controllers/auth.controller.js#verifyUserByOtp
- src/controllers/oauth.controller.js#googleCallback
- src/controllers/oauth.controller.js#googleFailed
- src/controllers/oauth.controller.js#googleRedirect
- src/controllers/oauth.controller.js#googleSuccess

### src/utils/ApiError.js

- src/controllers/auth.controller.js#addNewUser
- src/controllers/auth.controller.js#changeCurrentPassword
- src/controllers/auth.controller.js#deleteUser
- src/controllers/auth.controller.js#editUserDetails
- src/controllers/auth.controller.js#forgotPasswordRequest
- src/controllers/auth.controller.js#getAllUsers
- src/controllers/auth.controller.js#getCurrentUser
- src/controllers/auth.controller.js#loginUser
- src/controllers/auth.controller.js#logoutUser
- src/controllers/auth.controller.js#refreshAccessToken
- src/controllers/auth.controller.js#registerUser
- src/controllers/auth.controller.js#verifyUserByOtp
- src/controllers/oauth.controller.js#googleCallback
- src/controllers/oauth.controller.js#googleFailed
- src/controllers/oauth.controller.js#googleRedirect
- src/controllers/oauth.controller.js#googleSuccess
- src/controllers/upload.controller.js#uploadFile
- src/middlewares/auth.middlewares.js#verifyJWT
- src/middlewares/auth.middlewares.js#verifyPermission
- src/middlewares/error.middlewares.js#errorHandler
- src/services/auth.service.js#addNewUser
- src/services/auth.service.js#changeCurrentPassword
- src/services/auth.service.js#deleteUser
- src/services/auth.service.js#editUserDetails
- src/services/auth.service.js#findOrCreateGoogleUser
- src/services/auth.service.js#forgotPasswordRequest
- src/services/auth.service.js#getAllUsers
- src/services/auth.service.js#loginUser
- src/services/auth.service.js#logoutUser
- src/services/auth.service.js#refreshAccessToken
- src/services/auth.service.js#registerUser
- src/services/auth.service.js#verifyUserByOtp
- src/validators/validate.js#validate

### src/utils/ApiResponse.js

- src/controllers/auth.controller.js#addNewUser
- src/controllers/auth.controller.js#changeCurrentPassword
- src/controllers/auth.controller.js#deleteUser
- src/controllers/auth.controller.js#editUserDetails
- src/controllers/auth.controller.js#forgotPasswordRequest
- src/controllers/auth.controller.js#getAllUsers
- src/controllers/auth.controller.js#getCurrentUser
- src/controllers/auth.controller.js#loginUser
- src/controllers/auth.controller.js#logoutUser
- src/controllers/auth.controller.js#refreshAccessToken
- src/controllers/auth.controller.js#registerUser
- src/controllers/auth.controller.js#verifyUserByOtp
- src/controllers/healthcheck.controller.js#healthcheck
- src/controllers/oauth.controller.js#googleCallback
- src/controllers/oauth.controller.js#googleFailed
- src/controllers/oauth.controller.js#googleRedirect
- src/controllers/oauth.controller.js#googleSuccess
- src/controllers/upload.controller.js#uploadFile

### src/utils/asyncHandler.js

- src/controllers/auth.controller.js#addNewUser
- src/controllers/auth.controller.js#changeCurrentPassword
- src/controllers/auth.controller.js#deleteUser
- src/controllers/auth.controller.js#editUserDetails
- src/controllers/auth.controller.js#forgotPasswordRequest
- src/controllers/auth.controller.js#getAllUsers
- src/controllers/auth.controller.js#getCurrentUser
- src/controllers/auth.controller.js#loginUser
- src/controllers/auth.controller.js#logoutUser
- src/controllers/auth.controller.js#refreshAccessToken
- src/controllers/auth.controller.js#registerUser
- src/controllers/auth.controller.js#verifyUserByOtp
- src/controllers/healthcheck.controller.js#healthcheck
- src/controllers/oauth.controller.js#googleCallback
- src/controllers/oauth.controller.js#googleFailed
- src/controllers/oauth.controller.js#googleRedirect
- src/controllers/oauth.controller.js#googleSuccess

### src/utils/jwt.js

- src/services/auth.service.js#addNewUser
- src/services/auth.service.js#changeCurrentPassword
- src/services/auth.service.js#deleteUser
- src/services/auth.service.js#editUserDetails
- src/services/auth.service.js#findOrCreateGoogleUser
- src/services/auth.service.js#forgotPasswordRequest
- src/services/auth.service.js#getAllUsers
- src/services/auth.service.js#loginUser
- src/services/auth.service.js#logoutUser
- src/services/auth.service.js#refreshAccessToken
- src/services/auth.service.js#registerUser
- src/services/auth.service.js#verifyUserByOtp

### src/utils/mail.js

- src/services/auth.service.js#addNewUser
- src/services/auth.service.js#changeCurrentPassword
- src/services/auth.service.js#deleteUser
- src/services/auth.service.js#editUserDetails
- src/services/auth.service.js#findOrCreateGoogleUser
- src/services/auth.service.js#forgotPasswordRequest
- src/services/auth.service.js#getAllUsers
- src/services/auth.service.js#loginUser
- src/services/auth.service.js#logoutUser
- src/services/auth.service.js#refreshAccessToken
- src/services/auth.service.js#registerUser
- src/services/auth.service.js#verifyUserByOtp

### src/utils/otp.js

- src/services/auth.service.js#addNewUser
- src/services/auth.service.js#changeCurrentPassword
- src/services/auth.service.js#deleteUser
- src/services/auth.service.js#editUserDetails
- src/services/auth.service.js#findOrCreateGoogleUser
- src/services/auth.service.js#forgotPasswordRequest
- src/services/auth.service.js#getAllUsers
- src/services/auth.service.js#loginUser
- src/services/auth.service.js#logoutUser
- src/services/auth.service.js#refreshAccessToken
- src/services/auth.service.js#registerUser
- src/services/auth.service.js#verifyUserByOtp

### src/utils/password.js

- src/services/auth.service.js#addNewUser
- src/services/auth.service.js#changeCurrentPassword
- src/services/auth.service.js#deleteUser
- src/services/auth.service.js#editUserDetails
- src/services/auth.service.js#findOrCreateGoogleUser
- src/services/auth.service.js#forgotPasswordRequest
- src/services/auth.service.js#getAllUsers
- src/services/auth.service.js#loginUser
- src/services/auth.service.js#logoutUser
- src/services/auth.service.js#refreshAccessToken
- src/services/auth.service.js#registerUser
- src/services/auth.service.js#verifyUserByOtp

## Excluded Modules

- src/app.js: Application bootstrap and framework wiring only.
- src/index.js: Process entrypoint only.
- src/config/db.js: Real database bootstrap; excluded from unit scope.
- src/routes/*.js: Route registration only; HTTP route tests are explicitly out of scope.
- src/models/**/*.js: ORM models are persistence definitions, not unit-level business logic here.
- src/queries/auth.queries.js: Thin ORM wrapper around Sequelize model calls; treated as downstream dependency.
- src/logger/*.js: Logging infrastructure only.
- src/middlewares/upload.middleware.js: Multer wiring/infrastructure; minimal repo-specific value compared with business-logic modules.
- src/constants.js: Static constants only.
