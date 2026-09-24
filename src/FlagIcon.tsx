import { StyleSheet, View } from 'react-native';

import type { LanguageId } from './preferences';

export function FlagIcon({ language }: { language: LanguageId }) {
  if (language === 'fr') {
    return <View style={styles.flag}><View style={[styles.third, styles.blue]} /><View style={[styles.third, styles.white]} /><View style={[styles.third, styles.red]} /></View>;
  }
  if (language === 'es') {
    return <View style={[styles.flag, styles.flagColumn]}><View style={[styles.band, styles.red]} /><View style={[styles.doubleBand, styles.yellow]} /><View style={[styles.band, styles.red]} /></View>;
  }
  if (language === 'id') {
    return <View style={[styles.flag, styles.flagColumn]}><View style={[styles.half, styles.red]} /><View style={[styles.half, styles.white]} /></View>;
  }
  if (language === 'tr') {
    return <View style={[styles.flag, styles.red]}><View style={styles.crescentOuter} /><View style={styles.crescentInner} /><View style={styles.star} /></View>;
  }
  if (language === 'ar') {
    return <View style={[styles.flag, styles.saudi]}><View style={styles.saudiScript} /><View style={styles.saudiSword} /></View>;
  }
  return (
    <View style={[styles.flag, styles.blue]}>
      <View style={[styles.diagonal, styles.diagonalOne]} />
      <View style={[styles.diagonal, styles.diagonalTwo]} />
      <View style={styles.ukWhiteHorizontal} />
      <View style={styles.ukWhiteVertical} />
      <View style={styles.ukRedHorizontal} />
      <View style={styles.ukRedVertical} />
    </View>
  );
}

const styles = StyleSheet.create({
  flag: { width: 28, height: 19, borderRadius: 3, overflow: 'hidden', borderWidth: 0.5, borderColor: 'rgba(23,35,29,0.18)', flexDirection: 'row', position: 'relative' },
  flagColumn: { flexDirection: 'column' },
  third: { width: '33.34%', height: '100%' },
  band: { width: '100%', height: '25%' },
  doubleBand: { width: '100%', height: '50%' },
  half: { width: '100%', height: '50%' },
  blue: { backgroundColor: '#204A87' },
  white: { backgroundColor: '#FFFFFF' },
  red: { backgroundColor: '#C83B42' },
  yellow: { backgroundColor: '#F4C542' },
  saudi: { backgroundColor: '#146A3A' },
  saudiScript: { position: 'absolute', left: 6, right: 6, top: 6, height: 2, borderRadius: 2, backgroundColor: '#FFFFFF' },
  saudiSword: { position: 'absolute', left: 8, right: 5, bottom: 4, height: 1, backgroundColor: '#FFFFFF', transform: [{ rotate: '-4deg' }] },
  crescentOuter: { position: 'absolute', width: 11, height: 11, borderRadius: 6, backgroundColor: '#FFFFFF', left: 6, top: 4 },
  crescentInner: { position: 'absolute', width: 9, height: 9, borderRadius: 5, backgroundColor: '#C83B42', left: 9, top: 4 },
  star: { position: 'absolute', width: 3, height: 3, borderRadius: 2, backgroundColor: '#FFFFFF', left: 17, top: 8 },
  diagonal: { position: 'absolute', left: -4, top: 7, width: 36, height: 5, backgroundColor: '#FFFFFF' },
  diagonalOne: { transform: [{ rotate: '34deg' }] },
  diagonalTwo: { transform: [{ rotate: '-34deg' }] },
  ukWhiteHorizontal: { position: 'absolute', left: 0, right: 0, top: 6, height: 7, backgroundColor: '#FFFFFF' },
  ukWhiteVertical: { position: 'absolute', top: 0, bottom: 0, left: 10, width: 8, backgroundColor: '#FFFFFF' },
  ukRedHorizontal: { position: 'absolute', left: 0, right: 0, top: 8, height: 3, backgroundColor: '#C83B42' },
  ukRedVertical: { position: 'absolute', top: 0, bottom: 0, left: 12, width: 4, backgroundColor: '#C83B42' },
});
