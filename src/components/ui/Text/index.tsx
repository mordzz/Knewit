import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { colors, typography } from '@/theme';
import type { TypographyVariant } from '@/theme/typography';
import type { ColorToken } from '@/theme/colors';

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: ColorToken;
}

export function Text({ variant = 'body', color = 'textPrimary', style, ...rest }: TextProps) {
  return (
    <RNText
      style={[typography.scale[variant], { color: colors[color] }, style]}
      {...rest}
    />
  );
}
