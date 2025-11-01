import { randomBytes } from "crypto";

export function generateUniqueCode(): string {
  return randomBytes(16).toString("hex").substring(0, 25);
}
