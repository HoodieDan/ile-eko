import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';

export function Divider({ style }: { style?: StyleProp<ViewStyle> }): React.ReactElement {
  return <View style={[{ height: 1, backgroundColor: colors.line }, style]} />;
}
