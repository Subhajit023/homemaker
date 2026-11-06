import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ToastProvider } from '@/components/toast';
import { BoardProvider } from '@/features/board/board-store';
import { FamilyProvider } from '@/features/family/family-store';
import { InventoryProvider } from '@/features/inventory/inventory-store';
import { SharingProvider } from '@/features/sharing/sharing-store';
import { LanguageProvider, useLanguage } from '@/i18n';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <LanguageProvider>
        <FamilyProvider>
          <InventoryProvider>
            <SharingProvider>
              <BoardProvider>
                <ToastProvider>
                  <AppStack />
                </ToastProvider>
              </BoardProvider>
            </SharingProvider>
          </InventoryProvider>
        </FamilyProvider>
      </LanguageProvider>
      <AnimatedSplashOverlay />
    </ThemeProvider>
  );
}

/** Screens. Keyed by language so every screen (and its formatted dates) re-draws on change. */
function AppStack() {
  const { lang } = useLanguage();
  return (
    <Stack key={lang}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="item/[id]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="plan/new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="plan/manage" options={{ presentation: 'modal' }} />
      <Stack.Screen name="family" options={{ presentation: 'modal' }} />
      <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
