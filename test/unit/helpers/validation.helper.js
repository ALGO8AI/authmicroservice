import { validationResult } from "express-validator";

export const runValidationChains = async (chains, req) => {
  for (const chain of chains) {
    await chain.run(req);
  }

  return validationResult(req);
};
