// Note: Our custom error extends from Error, so we can throw this error as an exception.
export class CustomError extends Error {
  message!: string;
  status!: number;
  additionalInfo!: any;

  constructor(message: string, status = 500, additionalInfo: any = undefined) {
    super(message);
    this.message = message;
    this.status = status;
    this.additionalInfo = additionalInfo;
  }
}

export interface IResponseError {
  message: string;
  additionalInfo?: string;
}

export class ClientError extends CustomError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message: string) {
    super(message, 401);
  }
}

export class ForbiddenError extends CustomError {
  constructor(message: string) {
    super(message, 403);
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string) {
    super(message, 404);
  }
}
