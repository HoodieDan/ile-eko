import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { colors } from '../tokens/colors';
import { radii } from '../tokens/radii';
import { Text } from './Text';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  scroll?: boolean;
}

/** Bottom sheet modal — scrim, grabber, rounded top surface. */
export function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  scroll = false,
}: BottomSheetProps): React.ReactElement {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Pressable
          onPress={onClose}
          style={{ flex: 1, backgroundColor: 'rgba(15,16,14,0.42)', justifyContent: 'flex-end' }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: radii.sheet,
              borderTopRightRadius: radii.sheet,
              paddingTop: 10,
              paddingHorizontal: 20,
              paddingBottom: 28,
              maxHeight: '88%',
            }}
          >
            <View
              style={{
                width: 40,
                height: 5,
                borderRadius: 999,
                backgroundColor: colors.line,
                alignSelf: 'center',
                marginBottom: 16,
              }}
            />
            {title ? <Text variant="title">{title}</Text> : null}
            {subtitle ? (
              <Text variant="caption" color={colors.muted} style={{ marginTop: 4 }}>
                {subtitle}
              </Text>
            ) : null}
            {scroll ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                nestedScrollEnabled
              >
                {children}
              </ScrollView>
            ) : (
              <View>{children}</View>
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
