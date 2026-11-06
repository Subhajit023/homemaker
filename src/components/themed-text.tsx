import { Platform, StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCurrentLang } from '@/i18n';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

/**
 * Bengali and Hindi letters have vowel signs above and below the line (ি ী ু ্র / ि ी ु).
 * English-sized line heights clip them, which makes words look misspelled, so give
 * those scripts more room.
 */
const INDIC_LINE_HEIGHT = 1.55;

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const lang = useCurrentLang();

  const combined = [{ color: theme[themeColor ?? 'text'] }, styles[type], style];
  if (lang === 'en') return <Text style={combined} {...rest} />;

  const flat: TextStyle = StyleSheet.flatten(combined) ?? {};
  const fontSize = flat.fontSize ?? 14;
  const lineHeight =
    flat.lineHeight !== undefined
      ? Math.max(flat.lineHeight, Math.round(fontSize * INDIC_LINE_HEIGHT))
      : undefined;
  return <Text style={[flat, lineHeight !== undefined && { lineHeight }]} {...rest} />;
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 500,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 700,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 500,
  },
  title: {
    fontSize: 48,
    fontWeight: 600,
    lineHeight: 52,
  },
  subtitle: {
    fontSize: 32,
    lineHeight: 44,
    fontWeight: 600,
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 14,
    color: '#3c87f7',
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});
