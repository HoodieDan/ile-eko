// TODO: paste from Ilé Èkó Brand Board — the locked Adire/indigo palette.
// The values below are neutral, accessible placeholders that compile and
// look reasonable; they should be overwritten with the brand-board hex codes.

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface ThemeColors {
  // Surface
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceElevated: string;
  border: string;
  borderStrong: string;

  // Text
  text: string;
  textMuted: string;
  textSubtle: string;
  textInverse: string;

  // Brand
  primary: string;
  primaryMuted: string;
  primaryOn: string;

  // Accents
  accent: string;
  accentOn: string;

  // AI — use ONLY for AI components (AICard, AIBadge, etc.)
  aiAccent: string;
  aiAccentMuted: string;
  aiAccentOn: string;

  // Status / state
  success: string;
  successMuted: string;
  warning: string;
  warningMuted: string;
  danger: string;
  dangerMuted: string;
  info: string;
  infoMuted: string;

  // Status pills
  pillVacant: string;
  pillOccupied: string;
  pillOverdue: string;
  pillPending: string;
  pillConfirmed: string;
  pillPartial: string;
}

// TODO: paste from Ilé Èkó Brand Board — Adire/indigo palette
const indigo: ColorScale = {
  50: '#EEF0FB',
  100: '#D6DBF3',
  200: '#AAB4E5',
  300: '#7D8DD7',
  400: '#5066C8',
  500: '#293F9E',
  600: '#21337E',
  700: '#19265F',
  800: '#101A40',
  900: '#080D20',
};

// TODO: paste from Ilé Èkó Brand Board — AI accent (distinct from primary)
const aiViolet: ColorScale = {
  50: '#F4EEFB',
  100: '#E0D0F4',
  200: '#C0A2E8',
  300: '#A074DC',
  400: '#8047CF',
  500: '#5F2BA3',
  600: '#4C2282',
  700: '#391A62',
  800: '#261141',
  900: '#130821',
};

export const lightTheme: ThemeColors = {
  background: '#FAFAF7',
  surface: '#FFFFFF',
  surfaceMuted: '#F2F2EE',
  surfaceElevated: '#FFFFFF',
  border: '#E5E5E0',
  borderStrong: '#CFCFC8',

  text: '#1A1A1A',
  textMuted: '#525252',
  textSubtle: '#8A8A82',
  textInverse: '#FFFFFF',

  primary: indigo[500],
  primaryMuted: indigo[100],
  primaryOn: '#FFFFFF',

  accent: '#C8553D', // TODO: brand board accent
  accentOn: '#FFFFFF',

  aiAccent: aiViolet[500],
  aiAccentMuted: aiViolet[100],
  aiAccentOn: '#FFFFFF',

  success: '#0F8A4D',
  successMuted: '#D6F2E2',
  warning: '#B86E00',
  warningMuted: '#FCEACB',
  danger: '#B3261E',
  dangerMuted: '#F8D7D4',
  info: indigo[400],
  infoMuted: indigo[100],

  pillVacant: '#0F8A4D',
  pillOccupied: indigo[500],
  pillOverdue: '#B3261E',
  pillPending: '#B86E00',
  pillConfirmed: '#0F8A4D',
  pillPartial: '#B86E00',
};

export const darkTheme: ThemeColors = {
  background: '#0E0F14',
  surface: '#16181F',
  surfaceMuted: '#1C1E26',
  surfaceElevated: '#22252F',
  border: '#2A2D38',
  borderStrong: '#3A3E4C',

  text: '#F5F5F1',
  textMuted: '#B3B3AC',
  textSubtle: '#7E7E76',
  textInverse: '#0E0F14',

  primary: indigo[300],
  primaryMuted: indigo[800],
  primaryOn: '#0E0F14',

  accent: '#E68A77',
  accentOn: '#0E0F14',

  aiAccent: aiViolet[300],
  aiAccentMuted: aiViolet[800],
  aiAccentOn: '#0E0F14',

  success: '#3DD68C',
  successMuted: '#103923',
  warning: '#F4B23A',
  warningMuted: '#3A2A0B',
  danger: '#F26B63',
  dangerMuted: '#3A1414',
  info: indigo[300],
  infoMuted: indigo[800],

  pillVacant: '#3DD68C',
  pillOccupied: indigo[300],
  pillOverdue: '#F26B63',
  pillPending: '#F4B23A',
  pillConfirmed: '#3DD68C',
  pillPartial: '#F4B23A',
};
