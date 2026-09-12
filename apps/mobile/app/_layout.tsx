import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor="#FAF7F2" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#FAF7F2',
          },
          headerTintColor: '#2C1810',
          headerTitleStyle: {
            fontWeight: '800',
            fontSize: 20,
          },
          contentStyle: {
            backgroundColor: '#FAF7F2',
          },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="games/index" options={{ title: 'Cognitive Games' }} />
        <Stack.Screen name="games/[id]" options={{ title: 'Play Game' }} />
        <Stack.Screen name="companion" options={{ title: 'AI Voice Companion' }} />
        <Stack.Screen name="memories" options={{ title: 'Cherished Memories' }} />
        <Stack.Screen name="reminders" options={{ title: 'Daily Reminders' }} />
        <Stack.Screen name="caregiver/index" options={{ title: 'Caregiver Portal' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
