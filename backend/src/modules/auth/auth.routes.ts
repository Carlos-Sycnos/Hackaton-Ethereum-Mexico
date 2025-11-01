import { Router } from "express";
import { authController } from "./auth.module";
import { authenticateJWT } from "../../common/strategies/jwt.strategy";

const authRoutes = Router();

authRoutes.get("/verify/isVerifyCodeValid", authController.isVerifyCodeValid);
authRoutes.get("/refresh", authController.refreshToken);

authRoutes.post("/register", authController.register);
authRoutes.post("/login", authController.login);
authRoutes.post("/verify/email", authController.verifyEmail);
authRoutes.post(
  "/verify/resendVerificationEmail",
  authController.resendVerificationEmail
);
authRoutes.post("/password/forgot", authController.forgotPassword);
authRoutes.post("/password/reset", authController.resetPassword);
authRoutes.post("/logout", authenticateJWT, authController.logout);

export default authRoutes;
