import PlatformUsers from "../models/auth/PlatformUsers.model.js";

export const EXCLUDED_FIELDS = [
  "password",
  "pin",
  "refreshToken",
  "otp",
  "generationTime",
  "otpAttempts",
  "otpLockedUntil",
];

const userQueries = {
  findOne: async function (filter) {
    return await PlatformUsers.findOne(filter);
  },
  findById: async function (id, options) {
    return await PlatformUsers.findByPk(id, options);
  },
  find: async function (filter) {
    return await PlatformUsers.findAll(filter);
  },
  create: async function (body, options) {
    return await PlatformUsers.create(body, options);
  },
  findOneAndUpdate: async function (filter, body) {
    const data = await PlatformUsers.findOne({ where: filter });
    if (!data) throw new Error("Record not found");
    await data.update(body);
    // Re-fetch without sensitive fields so callers never see password/tokens.
    return await PlatformUsers.findByPk(data.userId, {
      attributes: { exclude: EXCLUDED_FIELDS },
    });
  },
  clearRefreshToken: async function (userId) {
    return await PlatformUsers.update(
      { refreshToken: null },
      { where: { userId } },
    );
  },
  delete: async function (userId) {
    return await PlatformUsers.destroy({ where: { userId } });
  },
  getAllUsers: async function ({ limit = 20, offset = 0 } = {}) {
    const { count, rows } = await PlatformUsers.findAndCountAll({
      attributes: { exclude: EXCLUDED_FIELDS },
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });
    return { users: rows, total: count, limit, offset };
  },
};

export default userQueries;
