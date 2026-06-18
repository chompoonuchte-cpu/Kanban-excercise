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

export const VALIDATION = {
  BOARD_NAME_MAX: 100,
  COLUMN_NAME_MAX: 100,
  CARD_TITLE_MAX: 255,
  CARD_DESCRIPTION_MAX: 5000,
  SUBTASK_TITLE_MAX: 100,
  SUBTASK_MAX_PER_CARD: 20,
  PASSWORD_MIN: 8,
  DISPLAY_NAME_MAX: 100,
} as const;

export const LABEL_COLORS = [
  "red", "orange", "yellow", "green", "teal",
  "blue", "indigo", "purple", "pink", "gray",
] as const;

export type LabelColor = (typeof LABEL_COLORS)[number];

export const LABEL_COLOR_HEX: Record<LabelColor, string> = {
  red: "#EF4444",
  orange: "#F97316",
  yellow: "#EAB308",
  green: "#22C55E",
  teal: "#14B8A6",
  blue: "#3B82F6",
  indigo: "#6366F1",
  purple: "#A855F7",
  pink: "#EC4899",
  gray: "#6B7280",
};
