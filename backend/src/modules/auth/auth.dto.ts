// ============================================================================
// Auth DTOs — Request/Response types for authentication
// ============================================================================
export class LoginDto {
  phone?: string;
  email?: string;
  password?: string;
  otp?: string;
}

export class RegisterDto {
  name: string;
  phone?: string;
  email?: string;
  password?: string;
  role?: 'ELDER' | 'CAREGIVER';
  language?: string;
}

export class RequestOtpDto {
  phone: string;
}

export class VerifyOtpDto {
  phone: string;
  otp: string;
}

export class RefreshTokenDto {
  refreshToken: string;
}

export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    role: string;
    language: string;
  };
}
