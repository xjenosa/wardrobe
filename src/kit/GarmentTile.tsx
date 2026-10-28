import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { drawn } from '../strings/drawn';
import { font } from '../theme/font';
import { Camera, Heart } from '../theme/icons';
import { light } from '../theme/tokens';
import { reach } from './reach';

const f = drawn.fig15;

/* ONE GARMENT IN THE CLOSET'S GRID (.piece). Its picture sits in a frame four
   wide by five tall, with its name under it and the word for what it is in
   small capitals under that (Fig 15, and the closet behind the editor in Figs
   19 and 19b). The whole tile opens the garment, as the plate's name button
   does by covering it.

   - `picture` fills the frame, the cut-out or the photograph. With none yet
     the frame is the empty box the plates draw for a piece still to come
     (.hp, Fig 08d).
   - `photo` is a photograph not cut out yet (.is-uncut, Fig 15's first two
     tiles). The frame takes the photograph's ground and a hairline, and the
     Photo mark sits in its corner.
   - `onFavourite` draws the heart, which turns on and off by itself and so is
     a button of its own, not part of the tile's. Fig 19 draws the grid with
     none.

   The heart's label is the plate's own, "Favourite, Harbour tee", with this
   garment's name in place of the plate's. */
export function GarmentTile({
  name,
  category,
  onPress,
  picture,
  photo = false,
  favourite = false,
  onFavourite,
}: {
  name: string;
  /* the word under the name, as Fig 15 prints it, like Top or Sweater */
  category: string;
  onPress: () => void;
  picture?: ReactNode;
  photo?: boolean;
  favourite?: boolean;
  onFavourite?: () => void;
}) {
  return (
    <View style={styles.tile}>
      <Pressable accessibilityRole="button" accessibilityLabel={name} onPress={onPress}>
        {({ pressed }) => (
          <>
            <View style={[styles.frame, photo ? styles.photo : picture ? null : styles.empty]}>
              <View style={[styles.picture, pressed && styles.lifted]}>{picture}</View>
              {photo ? (
                <>
                  <View pointerEvents="none" style={styles.rule} />
                  <View style={styles.mark}>
                    <Camera color={light.muted} />
                    <Text style={styles.markText}>{f.photo}</Text>
                  </View>
                </>
              ) : null}
            </View>
            <View style={styles.caption}>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.category}>{category}</Text>
            </View>
          </>
        )}
      </Pressable>
      {onFavourite ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={f.favouriteHarbourTee.replace(f.harbourTee, name)}
          accessibilityState={{ selected: favourite }}
          onPress={onFavourite}
          /* 24 square, so it reaches 44 to the sides as well, where its only
             neighbour is its own tile's picture */
          hitSlop={{ ...reach(HEART), left: 10, right: 10 }}
          style={styles.heart}
        >
          {({ pressed }) => (
            <Heart filled={favourite} color={photo ? light.photoInk : favourite || pressed ? light.ink : light.muted} />
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const HEART = 24;

const styles = StyleSheet.create({
  tile: { padding: 8 },
  frame: { width: '100%', aspectRatio: 0.8, overflow: 'hidden' },
  empty: { borderWidth: 1, borderColor: light.hairline, backgroundColor: light.field },
  photo: { experimental_backgroundImage: `linear-gradient(155deg, ${light.photoGround} 0%, ${light.photoShade} 100%)` },
  picture: { flex: 1 },
  lifted: { transform: [{ translateY: -3 }] },
  rule: { ...StyleSheet.absoluteFill, borderWidth: 1, borderColor: light.hairline },
  mark: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: light.hairline,
    backgroundColor: light.surface,
  },
  markText: { fontFamily: font.semibold, fontSize: 11, letterSpacing: 0.66, color: light.muted },
  caption: { marginTop: 8, paddingHorizontal: 4, alignItems: 'center' },
  name: { fontFamily: font.medium, fontSize: 12, lineHeight: 14.4, letterSpacing: 0.06, textAlign: 'center', color: light.ink },
  category: {
    marginTop: 4,
    fontFamily: font.semibold,
    fontSize: 11,
    letterSpacing: 1.54,
    textTransform: 'uppercase',
    textAlign: 'center',
    color: light.muted,
  },
  heart: { position: 'absolute', top: 16, right: 16, width: HEART, height: HEART, alignItems: 'center', justifyContent: 'center' },
});
