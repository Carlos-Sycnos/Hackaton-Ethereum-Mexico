import { ErrorCode } from "../../common/enums/error-code.enum";
import { VerificationEnum } from "../../common/enums/verification-code.enum";
import {
  IsVerificationCodeValidResult,
  LoginDto,
  RegisterDto,
  resetPasswordDto,
  VerifyEmailDto,
} from "../../common/interface/auth.interface";
import {
  BadRequestException,
  HttpException,
  InternalServerException,
  NotFoundException,
  UnauthorizedException,
} from "../../common/utils/catch-errors";
import {
  anHourFromNow,
  calculateExpirationDate,
  fortyFiveMinutesFromNow,
  ONE_DAY_IN_MS,
  threeMinutesAgo,
} from "../../common/utils/date_time";
import { config } from "../../config/app.config";
import {
  refreshTokenSignOptions,
  RefreshTPayload,
  signJwtToken,
  verifyJwtToken,
} from "../../common/utils/jwt";
import { sendEmail } from "../../mailers/mailer";
import {
  passwordResetTemplate,
  verifyEmailTemplate,
} from "../../mailers/templates/template";
import { HTTPSTATUS } from "../../config/http.config";
import { hashValue } from "../../common/utils/bcrypt";
import { logger } from "../../common/utils/logger";
import { Session } from "../../database/models/session";
import { User } from "../../database/models/user";
import { VerificationCode } from "../../database/models/verification";
import { Op } from "sequelize";
import geoip from "geoip-lite";
const UAParser = require("ua-parser-js");

export class AuthService {
  public async register(registerData: RegisterDto) {
    const { email, password } = registerData;

    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      throw new BadRequestException(
        "User already exists with this email",
        ErrorCode.AUTH_EMAIL_ALREADY_EXISTS
      );
    }

    const newUser = await User.create({
      email,
      password,
    });

    const userId = newUser.id;

    const verification = await VerificationCode.create({
      userId,
      type: VerificationEnum.EMAIL_VERIFICATION,
      expiresAt: fortyFiveMinutesFromNow(),
    });

    // Sending verification email link
    const verificationUrl = `${config.FRONT_API}/auth/confirm-account?code=${verification.code}`;
    await sendEmail({
      to: newUser.email,
      ...verifyEmailTemplate(verificationUrl),
    });
  }

  public async login(loginData: LoginDto) {
    const { email, password, userAgent, ip } = loginData;

    logger.info(`Login attempt for email: ${email}`);
    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      logger.warn(`Login failed: User with email ${email} not found`);
      throw new BadRequestException(
        "Invalid email or password provided",
        ErrorCode.AUTH_USER_NOT_FOUND
      );
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn(`Login failed: Invalid password for email: ${email}`);
      throw new BadRequestException(
        "Invalid email or password provided",
        ErrorCode.AUTH_USER_NOT_FOUND
      );
    }

    //Aqui hay que checar si la cuenta ya esta verificada
    // if(!user.is_email_verified)
    // throw new BadRequestException(
    //     "User not verified",
    //     ErrorCode.USER_NOT_VERIFIED
    //   );
    // Y ya en el front mandar que revisen su correo o si le dan click para reenviar otro codigo
    // Por si se llegan a pedir muchos correos hay que hacer que al validar la cuenta a todos los destruya
    // Elq ue valido lo destruye, y luego buscar si hay otros de ese usuario y destruirlos tambien

    // Check if the user enable 2fa retuen user= null
    if (user.userPreferences.enable2FA) {
      logger.info(`2FA required for user ID: ${user.id}`);
      return {
        user: null,
        mfaRequired: true,
        accessToken: "",
        refreshToken: "",
      };
    }

    logger.info(`Creating session for user ID: ${user.id}`);

    const geo = geoip.lookup(ip);

    const city = geo?.city || "Unknown";
    const country = geo?.country || "Unknown";

    const parser = new UAParser(userAgent);
    const uaResult = parser.getResult();

    const deviceName = uaResult.device.model
      ? uaResult.device.model
      : uaResult.browser.name;
    const osName = uaResult.os.name;
    const deviceType = uaResult.device.type || "desktop";

    const session = await Session.create({
      userId: user.id,
      userAgent: userAgent || "",
      city,
      country,
      ip,
      deviceType,
      deviceName,
      osName,
    });

    logger.info(`Signing tokens for user ID: ${user.id}`);
    const accessToken = signJwtToken({
      userId: user.id,
      sessionId: session.id,
    });

    const refreshToken = signJwtToken(
      {
        sessionId: session.id,
      },
      refreshTokenSignOptions
    );

    logger.info(`Login successful for user ID: ${user.id}`);
    return {
      user: {
        id: user.id,
        name: user.name,
        surnames: user.surnames,
        email: user.email,
        currentSessionId: session.id,
        user_preferences: {
          enable2FA: user.userPreferences.enable2FA,
          emailNotification: user.userPreferences.emailNotification,
        },
      },
      accessToken,
      refreshToken,
      mfaRequired: false,
    };
  }

  public async refreshToken(refreshToken: string) {
    const { payload } = verifyJwtToken<RefreshTPayload>(refreshToken, {
      secret: refreshTokenSignOptions.secret,
    });

    if (!payload) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const session = await Session.findByPk(payload.sessionId);
    const now = Date.now();

    if (!session) {
      throw new UnauthorizedException("Session does not exist");
    }

    if (session.expiredAt.getTime() <= now) {
      throw new UnauthorizedException("Session expired");
    }

    const sessionRequireRefresh =
      session.expiredAt.getTime() - now <= ONE_DAY_IN_MS;

    if (sessionRequireRefresh) {
      session.expiredAt = calculateExpirationDate(
        config.JWT.REFRESH_EXPIRES_IN
      );
      await session.save();
    }

    const newRefreshToken = sessionRequireRefresh
      ? signJwtToken(
          {
            sessionId: session.id,
          },
          refreshTokenSignOptions
        )
      : undefined;

    const accessToken = signJwtToken({
      userId: session.userId,
      sessionId: session.id,
    });

    return {
      accessToken,
      newRefreshToken,
    };
  }

  public async verifyEmail(verifyEmailData: VerifyEmailDto) {
    const { code, userAgent, ip } = verifyEmailData;

    // Buscar el código de verificación válido
    const validCode = await VerificationCode.findOne({
      where: {
        code: code,
        type: VerificationEnum.EMAIL_VERIFICATION,
        expiresAt: { [Op.gt]: new Date() }, // OJO: en Sequelize hay que usar Op.gt
      },
    });

    if (!validCode) {
      throw new BadRequestException("Invalid or expired verification code");
    }

    // 2️⃣ Buscar usuario por ID
    const user = await User.findByPk(validCode.userId);
    if (!user) {
      throw new BadRequestException(
        "Unable to verify email address",
        ErrorCode.VALIDATION_ERROR
      );
    }

    // 3️⃣ Validar si ya estaba verificado (CHEQUEO EXTRA)
    if (user.is_email_verified === true) {
      // Eliminar igual el code si existía para limpieza
      await validCode.destroy();

      throw new BadRequestException(
        "Email is already verified",
        ErrorCode.VALIDATION_ERROR
      );
    }

    // 4️⃣ Marcar como verificado y guardar
    user.is_email_verified = true;
    await user.save();

    // 5️⃣ Eliminar el código de verificación
    await validCode.destroy();

    const geo = geoip.lookup(ip);

    const city = geo?.city || "Unknown";
    const country = geo?.country || "Unknown";

    const parser = new UAParser(userAgent);
    const uaResult = parser.getResult();

    const deviceName = uaResult.device.model
      ? uaResult.device.model
      : uaResult.browser.name;
    const osName = uaResult.os.name;
    const deviceType = uaResult.device.type || "desktop";

    // 6️⃣ Crear sesión y tokens (igual que login)
    const session = await Session.create({
      userId: user.id,
      userAgent: userAgent || "",
      city,
      country,
      ip,
      deviceType,
      deviceName,
      osName,
    });

    const accessToken = signJwtToken({
      userId: user.id,
      sessionId: session.id,
    });

    const refreshToken = signJwtToken(
      {
        sessionId: session.id,
      },
      refreshTokenSignOptions
    );

    return {
      user: {
        id: user.id,
        name: "",
        surnames: "",
        email: user.email,
        currentSessionId: session.id,
        user_preferences: {
          enable2FA: user.userPreferences.enable2FA,
          emailNotification: user.userPreferences.emailNotification,
        },
      },
      accessToken,
      refreshToken,
    };
  }

  public async isVerificationCodeValid(
    code: string
  ): Promise<IsVerificationCodeValidResult> {
    // 1️⃣ Buscar por código (no filtramos por expiresAt todavía)
    const verification = await VerificationCode.findOne({
      where: {
        code: code,
        type: VerificationEnum.EMAIL_VERIFICATION,
      },
    });

    // 2️⃣ No existe (ya usado o nunca creado)
    if (!verification) {
      return {
        status: "not_found",
        message: "Verification code not found or already used",
      };
    }

    // 3️⃣ Existe pero está expirado
    if (verification.expiresAt < new Date()) {
      const user = await User.findOne({
        where: { id: verification.userId },
      });

      return {
        userId: user!.id,
        status: "expired",
        message: "Verification code has expired",
      };
    }

    // 4️⃣ Es válido
    return {
      status: "valid",
      message: "Verification code is valid",
    };
  }

  public async resendVerificationEmail(userId: number, code: string) {
    const user = await User.findOne({
      where: { id: userId },
    });

    const [verification, newVerification] = await Promise.all([
      VerificationCode.findOne({
        where: {
          code,
          type: VerificationEnum.EMAIL_VERIFICATION,
        },
      }),
      VerificationCode.create({
        userId,
        type: VerificationEnum.EMAIL_VERIFICATION,
        expiresAt: fortyFiveMinutesFromNow(),
      }),
    ]);

    // Sending verification email link
    const verificationUrl = `http://localhost:3000/auth/confirm-account?code=${newVerification.code}`;
    await Promise.all([
      sendEmail({
        to: user!.email,
        ...verifyEmailTemplate(verificationUrl),
      }),
      verification?.destroy(),
    ]);
  }

  public async forgotPassword(email: string) {
    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    //check mail rate limit is 2 emails per 3 or 10 min
    const timeAgo = threeMinutesAgo();
    const maxAttempts = 2;

    const count = await VerificationCode.count({
      where: {
        userId: user.id,
        type: VerificationEnum.PASSWORD_RESET,
        createdAt: { [Op.gt]: timeAgo },
      },
    });

    if (count >= maxAttempts) {
      throw new HttpException(
        "Too many request, try again later",
        HTTPSTATUS.TOO_MANY_REQUESTS,
        ErrorCode.AUTH_TOO_MANY_ATTEMPTS
      );
    }

    const expiresAt = anHourFromNow();
    const validCode = await VerificationCode.create({
      userId: user.id,
      type: VerificationEnum.PASSWORD_RESET,
      expiresAt,
    });

    const resetLink = `${config.FRONT_API}/auth/reset-password?code=${validCode.code}`;

    const { data, error } = await sendEmail({
      to: user.email,
      ...passwordResetTemplate(resetLink),
    });

    if (!data?.id) {
      throw new InternalServerException(`${error?.name} ${error?.message}`);
    }

    return {
      url: resetLink,
      emailId: data.id,
    };
  }

  public async resetPassword({ code, password }: resetPasswordDto) {
    // Buscar código de verificación válido
    const validCode = await VerificationCode.findOne({
      where: {
        code,
        type: VerificationEnum.PASSWORD_RESET,
      },
    });

    // 2️⃣ No existe (ya usado o nunca creado)
    if (!validCode) {
      return {
        status: "not_found",
        message: "Verification code not found or already used",
      };
    }

    // 3️⃣ Existe pero está expirado TODO VER QUE HACER AQUI EN ESTE CASO
    // if (validCode.expiresAt < new Date()) {
    //   const user = await User.findOne({
    //     where: { id: validCode.userId },
    //   });

    //   return {
    //     userId: user!.id,
    //     status: "expired",
    //     message: "Verification code has expired",
    //   };
    // }

    // Hashear nueva contraseña
    const hashedPassword = await hashValue(password);

    // Actualizar usuario
    const [updatedCount, [updatedUser]] = await User.update(
      { password: hashedPassword },
      {
        where: { id: validCode.userId },
        returning: true, // para obtener el usuario actualizado
      }
    );

    if (!updatedUser) {
      throw new BadRequestException("Failed to reset password!");
    }

    // Borrar el código de verificación
    await validCode.destroy();

    // Borrar todas las sesiones del usuario
    await Session.destroy({
      where: { userId: updatedUser.id },
    });
  }

  public async changePassword({ code, password }: resetPasswordDto) {
    // Buscar código de verificación válido
    const validCode = await VerificationCode.findOne({
      where: {
        code,
        type: VerificationEnum.PASSWORD_RESET,
      },
    });

    // 2️⃣ No existe (ya usado o nunca creado)
    if (!validCode) {
      return {
        status: "not_found",
        message: "Verification code not found or already used",
      };
    }

    // 3️⃣ Existe pero está expirado TODO VER QUE HACER AQUI EN ESTE CASO
    // if (validCode.expiresAt < new Date()) {
    //   const user = await User.findOne({
    //     where: { id: validCode.userId },
    //   });

    //   return {
    //     userId: user!.id,
    //     status: "expired",
    //     message: "Verification code has expired",
    //   };
    // }

    // Hashear nueva contraseña
    const hashedPassword = await hashValue(password);

    // Actualizar usuario
    const [updatedCount, [updatedUser]] = await User.update(
      { password: hashedPassword },
      {
        where: { id: validCode.userId },
        returning: true, // para obtener el usuario actualizado
      }
    );

    if (!updatedUser) {
      throw new BadRequestException("Failed to reset password!");
    }

    // Borrar el código de verificación
    await validCode.destroy();

    // Borrar todas las sesiones del usuario
    await Session.destroy({
      where: { userId: updatedUser.id },
    });
  }

  public async logout(sessionId: number) {
    return await Session.destroy({
      where: { id: sessionId },
    });
  }
}
