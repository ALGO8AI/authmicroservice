import bcrypt from "bcrypt";

export async function generateHashPassword(password) {
  return await bcrypt.hash(password, 10);
}

export async function isPasswordCorrect(password, hashPassword) {
  return await bcrypt.compare(password, hashPassword);
}
