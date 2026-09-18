export type ChoiceTone = 'yes' | 'no' | 'accent' | 'neutral';

/**
 * Web equivalent of `apps/mobile/src/utils/choiceTone.ts` — directional
 * labels keep the semantic green/red pair ("Yes"/"Up" green, "No"/"Down"
 * red); every other named choice uses the neutral pair (brand accent
 * index 0, neutral surface index 1) so green/red never implies a meaning
 * those choices don't have. See docs/DECISIONS.md ("Trading Any
 * Polymarket Choice").
 */
export function choiceTone(choice: { index: number; label: string }): ChoiceTone {
  const label = choice.label.toLowerCase();
  if (label === 'yes' || label === 'up') return 'yes';
  if (label === 'no' || label === 'down') return 'no';
  return choice.index % 2 === 0 ? 'accent' : 'neutral';
}

/** The text color token matching a tone — `neutral` reads as ordinary
 * primary text, not as a color. */
export function choiceTextColor(tone: ChoiceTone): 'yes' | 'no' | 'accent' | 'textPrimary' {
  if (tone === 'yes' || tone === 'no' || tone === 'accent') return tone;
  return 'textPrimary';
}
