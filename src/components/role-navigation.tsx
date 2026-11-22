import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { usePathname, useRouter } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import type { UserRole } from '@/types/models';

interface NavItem {
  href: Href;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  CLIENT: [
    { href: '/client/dashboard', label: 'Tableau de bord', icon: 'home-outline' },
    { href: '/client/collectes', label: 'Collectes', icon: 'compass-outline' },
    { href: '/client/reservations', label: 'Réservations', icon: 'calendar-outline' },
    { href: '/client/historique', label: 'Historique', icon: 'time-outline' },
    { href: '/profile-edit', label: 'Profil', icon: 'person-outline' },
    { href: '/', label: 'Accueil', icon: 'globe-outline' },
  ],
  COLLECTEUR: [
    { href: '/collector/dashboard', label: 'Tableau de bord', icon: 'home-outline' },
    { href: '/collector/publish', label: 'Publier', icon: 'add-circle-outline' },
    { href: '/collector/collections', label: 'Mes collectes', icon: 'calendar-outline' },
    { href: '/collector/reservations', label: 'Réservations', icon: 'people-outline' },
    { href: '/profile-edit', label: 'Profil', icon: 'person-outline' },
    { href: '/', label: 'Accueil', icon: 'globe-outline' },
  ],
  ADMIN: [
    { href: '/admin/dashboard', label: 'Tableau de bord', icon: 'grid-outline' },
    { href: '/admin/users', label: 'Utilisateurs', icon: 'people-outline' },
    { href: '/admin/collections', label: 'Collectes', icon: 'calendar-outline' },
    { href: '/admin/reservations', label: 'Réservations', icon: 'list-outline' },
    { href: '/admin/reports', label: 'Signalements', icon: 'alert-circle-outline' },
    { href: '/admin/settings', label: 'Paramètres', icon: 'settings-outline' },
    { href: '/', label: 'Accueil', icon: 'globe-outline' },
  ],
};

export function RoleNavigation() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 900;
  const colors = Colors.light;

  if (!user) return null;
  const items = NAV_ITEMS[user.role];

  return (
    <View style={[
      styles.navigation,
      isDesktop ? styles.desktopNavigation : styles.mobileNavigation,
      { backgroundColor: colors.background, borderColor: colors.backgroundElement },
    ]}>
      {isDesktop && (
        <View style={styles.brand}>
          <View style={[styles.brandIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="leaf" size={20} color="#fff" />
          </View>
          <Text style={[styles.brandText, { color: colors.text }]}>Collecte+</Text>
        </View>
      )}

      {isDesktop ? items.map((item) => {
        const active = pathname === item.href;
        return (
          <Pressable
            key={String(item.href)}
            onPress={() => router.push(item.href)}
            style={({ pressed }) => [
              styles.desktopItem,
              active && { backgroundColor: colors.backgroundSelected },
              pressed && { opacity: 0.65 },
            ]}
          >
            <Ionicons
              name={item.icon}
              size={20}
              color={active ? colors.primary : colors.textSecondary}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.desktopLabel,
                { color: active ? colors.primary : colors.textSecondary },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      }) : (
        <ScrollView
          horizontal
          style={styles.mobileScroll}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mobileItems}
        >
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Pressable
                key={String(item.href)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => router.push(item.href)}
                style={({ pressed }) => [
                  styles.mobileItem,
                  active && { backgroundColor: colors.backgroundSelected },
                  pressed && { opacity: 0.65 },
                ]}
              >
                <Ionicons name={item.icon} size={21} color={active ? colors.primary : colors.textSecondary} />
                <Text numberOfLines={1} style={[styles.mobileLabel, { color: active ? colors.primary : colors.textSecondary }]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {isDesktop && (
        <Pressable
          onPress={() => router.replace('/profile-edit')}
          style={[styles.desktopProfile, { borderTopColor: colors.backgroundElement }]}
        >
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{user.firstName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: colors.text }]} numberOfLines={1}>
              {user.firstName} {user.lastName}
            </Text>
            <Text style={[styles.profileRole, { color: colors.textSecondary }]}>
              {user.role === 'COLLECTEUR' ? 'Éboueur' : user.role === 'ADMIN' ? 'Administrateur' : 'Client'}
            </Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}

export function RoleShell({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 900;

  return (
    <View style={[styles.shell, { backgroundColor: Colors.light.background }]}>
      {isDesktop && <RoleNavigation />}
      <View style={[styles.content, isDesktop && styles.desktopContent]}>{children}</View>
      {!isDesktop && <RoleNavigation />}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  content: { flex: 1, width: '100%' },
  desktopContent: { marginLeft: 232, width: 'auto' },
  navigation: { zIndex: 20 },
  desktopNavigation: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 232,
    borderRightWidth: 1, paddingHorizontal: 16, paddingVertical: 20,
  },
  mobileNavigation: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 72,
    borderTopWidth: 1, flexDirection: 'row', paddingHorizontal: 4,
  },
  mobileScroll: { flex: 1 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24, paddingHorizontal: 8 },
  brandIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  brandText: { fontSize: 20, fontWeight: '800' },
  mobileItem: { width: 76, flexGrow: 0, flexShrink: 0, alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 12, marginVertical: 7 },
  mobileItems: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  desktopItem: { height: 48, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, paddingHorizontal: 12, marginBottom: 6 },
  mobileLabel: { fontSize: 10, fontWeight: '700' },
  desktopLabel: { flex: 1, fontSize: 14, fontWeight: '700' },
  desktopProfile: { position: 'absolute', bottom: 18, left: 16, right: 16, borderTopWidth: 1, paddingTop: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800' },
  profileName: { fontSize: 13, fontWeight: '800' },
  profileRole: { fontSize: 11, marginTop: 2 },
});
