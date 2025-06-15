export interface ParsedToken {
  userId: string;
  email?: string;
  iat?: number;
  exp?: number;
}

export interface ErrorResponse {
  error: {
    message: string;
    stack?: string;
  };
}

export interface RequestValidators {
  params?: any;
  body?: any;
  query?: any;
}

export interface AuthenticatedRequest extends Request {
  user?: ParsedToken;
}
