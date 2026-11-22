import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.backgroundElement, height: 65, paddingTop: 8, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: ({ color, size }) => (
        <Ionicons name="home-outline" size={size} color={typeof color === 'string' ? color : colors.primary} />
      ) }} />
      <Tabs.Screen name="explore" options={{ title: 'Explorer', tabBarIcon: ({ color, size }) => (
        <Ionicons name="compass-outline" size={size} color={typeof color === 'string' ? color : colors.primary} />
      ) }} />
    </Tabs>
  );
}
