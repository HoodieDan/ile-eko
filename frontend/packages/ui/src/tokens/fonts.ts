/**
 * Font assets for `expo-font` / `useFonts`. The keys MUST equal the family-name
 * strings used in `typography.ts`. Apps load these once at the root:
 *
 *   import { useFonts } from 'expo-font';
 *   import { fontAssets } from '@ile-eko/ui';
 *   const [loaded] = useFonts(fontAssets);
 */
import {
  BricolageGrotesque_400Regular,
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import {
  SplineSansMono_400Regular,
  SplineSansMono_500Medium,
} from '@expo-google-fonts/spline-sans-mono';

export const fontAssets: Record<string, number> = {
  BricolageGrotesque_400Regular,
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  SplineSansMono_400Regular,
  SplineSansMono_500Medium,
};
