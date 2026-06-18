export type HealthResponse = {
  status: "ok";
};

export type AuthUser = {
  id: string;
  displayName: string;
  email: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type RegisterBody = {
  displayName: string;
  email: string;
  password: string;
};

export type LoginBody = {
  email: string;
  password: string;
};

export type ErrorResponse = {
  error: string;
};
