import { UserAttributes } from "../database/models/user";
import { Request } from "express";

declare global {
  namespace Express {
    interface User extends UserAttributes {}

    interface Request {
      sessionId?: string;
    }
  }
}
