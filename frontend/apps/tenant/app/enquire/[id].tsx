import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProperty, useSendEnquiry } from '@ile-eko/core';
import { Body, Button, Heading, Input, useTheme, useToast } from '@ile-eko/ui';

// TODO: build to match Claude Design — Enquire form (full)
export default function Enquire(): React.ReactElement {
  const theme = useTheme();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: property } = useProperty(id);
  const sendEnquiry = useSendEnquiry();
  const [message, setMessage] = useState('');

  async function onSubmit() {
    if (!id || message.trim().length < 8) {
      toast.show('Write a short message first', 'warning');
      return;
    }
    await sendEnquiry.mutateAsync({ propertyId: id, message: message.trim() });
    toast.show('Enquiry sent', 'success');
    router.back();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <Heading level={1}>Enquire</Heading>
        {property ? (
          <Body color={theme.colors.textMuted}>
            About {property.propertyTitle} — {property.area}
          </Body>
        ) : null}
        <Input
          label="Your message"
          value={message}
          onChangeText={setMessage}
          placeholder="Hello, is this home still available?"
          multiline
          numberOfLines={5}
        />
        <Button
          label="Send enquiry"
          fullWidth
          loading={sendEnquiry.isPending}
          onPress={onSubmit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
