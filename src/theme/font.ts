import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';

/* THE MOCKUP'S ONE TYPEFACE, Inter, at the three weights its stylesheet loads
   (ADR 0011). Two of its rules ask for 200 and 700, and a browser holding only
   these three draws them at 400 and 600, so that is what the plates show.

   EACH WEIGHT IS ITS OWN FAMILY, so a style names the face and sets no
   fontWeight. One family with three faces picks by fontWeight only on Android
   10 and later; below that Android loads the regular face alone. */
export const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
} as const;

/* What App.tsx loads before it draws anything, under the names above. Each
   face is imported on its own, because the package's index pulls in all
   eighteen. */
export const faces = {
  [font.regular]: Inter_400Regular,
  [font.medium]: Inter_500Medium,
  [font.semibold]: Inter_600SemiBold,
};
