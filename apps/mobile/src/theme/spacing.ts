const unit = 4;

export const spacing = {
  xxs: unit, // 4
  xs: unit * 2, // 8
  sm: unit * 3, // 12
  md: unit * 4, // 16
  lg: unit * 6, // 24
  xl: unit * 8, // 32
  xxl: unit * 12, // 48
} as const;

export type SpacingToken = keyof typeof spacing;
