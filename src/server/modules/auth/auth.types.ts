import "server-only";

export type LoginInput = {
  email: string;
  password: string;
  rememberMe?: boolean;
  userAgent?: string;
  clientIp?: string;
};

export type LoginResult = {
  success: boolean;
  status: number;
  data?: {
    accessToken: string;
    refreshToken: string;
    attemptsRemaining?: number;
  };
  message?: string;
  errorCode?: string;
  attemptsRemaining?: number;
  loginBlockDuration?: number;
};

export type RefreshResult = {
  success: boolean;
  status: number;
  data?: { accessToken: string; refreshToken: string };
  message?: string;
};

