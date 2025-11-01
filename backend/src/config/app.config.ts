import { getEnv } from "../common/utils/get_env";

const appConfig = () => ({
  RAILWAY_ENVIRONMENT_NAME: getEnv("RAILWAY_ENVIRONMENT_NAME"),
  PORT: getEnv("PORT", "8000"),
  JWT: {
    SECRET: getEnv("JWT_SECRET"),
    EXPIRES_IN: getEnv("JWT_EXPIRES_IN", "15m"),
    REFRESH_SECRET: getEnv("JWT_REFRESH_SECRET"),
    REFRESH_EXPIRES_IN: getEnv("JWT_REFRESH_EXPIRES_IN", "30d"),
  },
  MAILER_SENDER: getEnv("MAILER_SENDER"),
  RESEND_API_KEY: getEnv("RESEND_API_KEY"),
  FRONT_API: getEnv("FRONT_API"),
});

export const config = appConfig();
