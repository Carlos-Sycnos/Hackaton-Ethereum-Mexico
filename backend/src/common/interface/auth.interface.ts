export interface RegisterDto {
  email: string;
  password: string;
  confirmPassword: string;
  userAgent?: string;
}

export interface LoginDto {
  ip: string;
  email: string;
  password: string;
  userAgent?: string;
}

export interface resetPasswordDto {
  password: string;
  code: string;
}

export interface VerifyEmailDto {
  code: string;
  userAgent?: string;
  ip: string;
}

export interface IsVerificationCodeValidResult {
  userId?: number;
  status: string;
  message: string;
}
