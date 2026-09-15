import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import type { TypographyVariant } from '@/theme/typography';
import type { ColorToken } from '@/theme/colors';
import { textColorClass, typographyClass } from '@/theme/tw';
import { cn } from '@/utils/cn';

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: ColorToken;
}

export function Text({ variant = 'body', color = 'textPrimary', className, ...rest }: TextProps) {
  return (
    <RNText className={cn(typographyClass[variant], textColorClass[color], className)} {...rest} />
  );
}
