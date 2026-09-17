import Svg, { Path } from 'react-native-svg';
import { colors } from '@/theme';
import type { ColorToken } from '@/theme/colors';

export interface XLogoProps {
  size?: number;
  color?: ColorToken;
}

/**
 * X's brand mark as a real vector path — not a font glyph. Ionicons
 * only ships the old Twitter bird (`logo-twitter`), and the unicode
 * "𝕏" (mathematical double-struck capital X) character used as a
 * placeholder before this component isn't the actual logo and isn't
 * guaranteed to render identically (or at all) across every
 * platform/font — a real SVG path renders identically everywhere.
 */
export function XLogo({ size = 18, color = 'textPrimary' }: XLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
        fill={colors[color]}
      />
    </Svg>
  );
}
