import type { TextProps } from 'react-native';
import { StyleSheet, Text as NativeText } from 'react-native';

export const fonts = {
  body: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
  extrabold: 'DMSans_800ExtraBold',
  display: 'Lora_600SemiBold',
  displayBold: 'Lora_700Bold',
} as const;

function bodyFontForWeight(weight: TextProps['style']) {
  const flattened = StyleSheet.flatten(weight);
  if (flattened?.fontFamily) return flattened.fontFamily;
  const numericWeight = Number(flattened?.fontWeight ?? 400);
  if (numericWeight >= 800) return fonts.extrabold;
  if (numericWeight >= 700) return fonts.bold;
  if (numericWeight >= 600) return fonts.semibold;
  if (numericWeight >= 500) return fonts.medium;
  return fonts.body;
}

export function AppText({ style, ...props }: TextProps) {
  return <NativeText {...props} style={[{ fontFamily: bodyFontForWeight(style) }, style]} />;
}
