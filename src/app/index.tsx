import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { getAppDatabase } from '@/services/data-service';
import { getRoleHomeRoute, getRoleLabel } from '@/services/role-service';
import type { AppDatabase, Reservation } from '@/types/models';

function formatDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(date);
}

function localDateKey(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export default function HomeScreen() {
  const colors = Colors.light;
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user, loading } = useAuth();
  const [database, setDatabase] = useState<AppDatabase | null>(null);
  const appName = database?.settings.appName ?? 'Collecte+';
  const registrationEnabled = database?.settings.allowPublicRegistration ?? true;

  const refresh = useCallback(async () => {
    try {
      setDatabase(await getAppDatabase());
    } catch {
      setDatabase(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const upcomingReservations: Array<{ reservation: Reservation; location: string; date: string; time: string }> =
    user?.role === 'CLIENT' && database
      ? database.reservations
          .filter((reservation) => reservation.clientId === user.id && reservation.status !== 'ANNULEE')
          .map((reservation) => {
            const collection = database.collections.find((item) => item.id === reservation.collectionId);
            return collection ? {
              reservation,
              location: collection.location,
              date: collection.date,
              time: collection.startTime,
            } : null;
          })
          .filter((item): item is NonNullable<typeof item> => item !== null)
          .filter((item) => item.date >= localDateKey())
          .sort((first, second) => `${first.date} ${first.time}`.localeCompare(`${second.date} ${second.time}`))
          .slice(0, 2)
      : [];

  const roleAction = user?.role === 'COLLECTEUR'
    ? { label: 'Publier une collecte', route: '/collector/publish' as const, icon: 'add-circle-outline' as const }
    : user?.role === 'ADMIN'
      ? { label: 'Gérer la plateforme', route: '/admin/dashboard' as const, icon: 'grid-outline' as const }
      : { label: 'Trouver une collecte', route: '/client/collectes' as const, icon: 'search-outline' as const };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Préparation de votre espace…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, { maxWidth: width >= 900 ? 1100 : 720 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={[styles.brandIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="leaf" size={22} color="#FFFFFF" />
            </View>
            <View>
              <Text style={[styles.brandName, { color: colors.text }]}>{appName}</Text>
              <Text style={[styles.brandTagline, { color: colors.textSecondary }]}>La propreté à votre portée</Text>
            </View>
          </View>
          {user ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ouvrir mon profil"
              onPress={() => router.push('/profile-edit')}
              style={[styles.avatar, { backgroundColor: colors.backgroundElement }]}
            >
              <Text style={[styles.avatarText, { color: colors.primary }]}>{user.firstName.charAt(0).toUpperCase()}</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={[styles.hero, width >= 700 && styles.heroWide]}>
          <View style={styles.heroCopy}>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>
              {user ? getRoleLabel(user.role).toUpperCase() : 'COLLECTE PLUS SIMPLE'}
            </Text>
            <Text style={[styles.heroTitle, { color: colors.text }]}>
              {user ? `Bonjour ${user.firstName} 👋` : 'Un environnement propre commence chez vous.'}
            </Text>
            <Text style={[styles.heroText, { color: colors.textSecondary }]}>
              {user?.role === 'COLLECTEUR'
                ? 'Organisez vos tournées et retrouvez les demandes des habitants.'
                : user?.role === 'ADMIN'
                  ? 'Suivez les collectes, les réservations et les comptes depuis un seul espace.'
                  : 'Réservez une collecte près de chez vous et suivez son avancement simplement.'}
            </Text>
          </View>
          <View style={[styles.heroMark, { backgroundColor: colors.backgroundElement }]}>
            <Ionicons name="leaf-outline" size={52} color={colors.primary} />
          </View>
        </View>

        {user ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(getRoleHomeRoute(user.role))}
            style={({ pressed }) => [styles.dashboardButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}
          >
            <View style={styles.dashboardIcon}><Ionicons name="speedometer-outline" size={21} color="#FFFFFF" /></View>
            <Text style={styles.dashboardLabel}>Accéder à mon tableau de bord</Text>
            <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
          </Pressable>
        ) : (
          <View style={styles.authActions}>
            <Pressable onPress={() => router.push('/login')} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.primaryButtonText}>Se connecter</Text>
            </Pressable>
            {registrationEnabled ? (
              <Pressable onPress={() => router.push('/register')} style={[styles.secondaryButton, { borderColor: colors.primary }]}>
                <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Créer un compte</Text>
              </Pressable>
            ) : <Text style={[styles.registrationClosed, { color: colors.textSecondary }]}>Les inscriptions sont temporairement fermées.</Text>}
          </View>
        )}

        <View style={styles.sectionHeading}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{user ? 'Que souhaitez-vous faire ?' : 'Les services Collecte+'}</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Des outils adaptés à chaque étape.</Text>
          </View>
        </View>

        <View style={[styles.actionGrid, width >= 700 && styles.actionGridWide]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(user ? roleAction.route : registrationEnabled ? '/register' : '/login')}
            style={({ pressed }) => [styles.actionCard, { backgroundColor: colors.primary }, pressed && styles.pressed]}
          >
            <View style={styles.actionIcon}><Ionicons name={user ? roleAction.icon : 'calendar-outline'} size={24} color="#FFFFFF" /></View>
            <Text style={styles.actionTitle}>{user ? roleAction.label : 'Planifier une collecte'}</Text>
            <Text style={styles.actionDescription}>{user?.role === 'COLLECTEUR' ? 'Ajoutez une tournée et ouvrez les réservations.' : user?.role === 'ADMIN' ? 'Consultez les indicateurs et gérez les comptes.' : 'Choisissez un quartier, une date et un créneau.'}</Text>
            <View style={styles.actionFooter}><Text style={styles.actionLink}>Continuer</Text><Ionicons name="arrow-forward" size={17} color="#FFFFFF" /></View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(user?.role === 'COLLECTEUR' ? '/collector/collections' : user?.role === 'ADMIN' ? '/admin/collections' : user ? '/client/reservations' : '/login')}
            style={({ pressed }) => [styles.actionCard, styles.secondaryCard, { backgroundColor: colors.backgroundElement }, pressed && styles.pressed]}
          >
            <View style={[styles.actionIcon, styles.secondaryIcon, { backgroundColor: colors.background }]}>
              <Ionicons name={user?.role === 'COLLECTEUR' ? 'calendar-outline' : user?.role === 'ADMIN' ? 'people-outline' : 'time-outline'} size={24} color={colors.primary} />
            </View>
            <Text style={[styles.actionTitle, { color: colors.text }]}>{user?.role === 'COLLECTEUR' ? 'Mes collectes' : user?.role === 'ADMIN' ? 'Superviser' : user ? 'Mes réservations' : 'Suivre une réservation'}</Text>
            <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>{user?.role === 'COLLECTEUR' ? 'Modifiez vos publications et vérifiez les places.' : user?.role === 'ADMIN' ? 'Gardez un œil sur l’activité de la plateforme.' : 'Retrouvez le statut et les détails de vos demandes.'}</Text>
            <View style={styles.actionFooter}><Text style={[styles.actionLink, { color: colors.primary }]}>Ouvrir</Text><Ionicons name="arrow-forward" size={17} color={colors.primary} /></View>
          </Pressable>
        </View>

        {user?.role === 'CLIENT' ? (
          <View style={styles.reservationSection}>
            <View style={styles.sectionHeading}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Prochaines réservations</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Les rendez-vous à venir près de chez vous.</Text>
              </View>
              <Pressable onPress={() => router.push('/client/reservations')} accessibilityRole="button">
                <Text style={[styles.seeAll, { color: colors.primary }]}>Tout voir</Text>
              </Pressable>
            </View>
            {upcomingReservations.length > 0 ? upcomingReservations.map(({ reservation, location, date, time }) => (
              <View key={reservation.id} style={[styles.reservationCard, { backgroundColor: colors.backgroundElement }]}>
                <View style={[styles.calendarIcon, { backgroundColor: colors.background }]}><Ionicons name="calendar-outline" size={21} color={colors.primary} /></View>
                <View style={styles.reservationInfo}>
                  <Text style={[styles.reservationLocation, { color: colors.text }]}>{location}</Text>
                  <Text style={[styles.reservationDetail, { color: colors.textSecondary }]}>{formatDate(date)} · {time}</Text>
                </View>
                <Text style={[styles.reservationStatus, { color: colors.primary }]}>{reservation.status === 'CONFIRMEE' ? 'Confirmée' : 'En attente'}</Text>
              </View>
            )) : (
              <View style={[styles.emptyCard, { backgroundColor: colors.backgroundElement }]}>
                <Ionicons name="calendar-clear-outline" size={28} color={colors.primary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucune collecte prévue</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Vos prochaines réservations apparaîtront ici.</Text>
                <Pressable onPress={() => router.push('/client/collectes')} accessibilityRole="button">
                  <Text style={[styles.emptyLink, { color: colors.primary }]}>Trouver une collecte</Text>
                </Pressable>
              </View>
            )}
          </View>
        ) : null}

        {!user ? (
          <View style={[styles.guestNote, { backgroundColor: colors.backgroundElement }]}>
            <Ionicons name="people-outline" size={22} color={colors.primary} />
            <Text style={[styles.guestText, { color: colors.textSecondary }]}>Clients, collecteurs et administrateurs retrouvent leur espace depuis cette page d’accueil.</Text>
          </View>
        ) : null}

        <Text style={[styles.footer, { color: colors.textSecondary }]}>Collecte+ · Ensemble pour un environnement propre</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { width: '100%', alignSelf: 'center', paddingHorizontal: 22, paddingTop: 16, paddingBottom: 36 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  brandIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  brandTagline: { fontSize: 11, marginTop: 2 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 17, fontWeight: '900' },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
  heroWide: { paddingVertical: 16 },
  heroCopy: { flex: 1 },
  eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginBottom: 9 },
  heroTitle: { fontSize: 27, lineHeight: 34, fontWeight: '900', letterSpacing: -0.7 },
  heroText: { fontSize: 14, lineHeight: 21, marginTop: 9, maxWidth: 590 },
  heroMark: { width: 72, height: 72, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  dashboardButton: { minHeight: 58, borderRadius: 15, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 30 },
  dashboardIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  dashboardLabel: { flex: 1, color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  authActions: { gap: 10, marginBottom: 30 },
  primaryButton: { minHeight: 52, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  secondaryButton: { minHeight: 52, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { fontSize: 15, fontWeight: '800' },
  registrationClosed: { fontSize: 12, textAlign: 'center', marginTop: 3 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 19, fontWeight: '900', marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, lineHeight: 18 },
  actionGrid: { gap: 12 },
  actionGridWide: { flexDirection: 'row', alignItems: 'stretch' },
  actionCard: { flex: 1, minHeight: 210, padding: 18, borderRadius: 18, justifyContent: 'space-between' },
  secondaryCard: { borderWidth: 1, borderColor: '#E5ECE7' },
  actionIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)', marginBottom: 16 },
  secondaryIcon: { backgroundColor: 'transparent' },
  actionTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginBottom: 6 },
  actionDescription: { color: 'rgba(255,255,255,0.86)', fontSize: 12, lineHeight: 19, flex: 1 },
  actionFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  actionLink: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  reservationSection: { marginTop: 30 },
  seeAll: { fontSize: 12, fontWeight: '800' },
  reservationCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 15, padding: 14, marginBottom: 10 },
  calendarIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  reservationInfo: { flex: 1 },
  reservationLocation: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  reservationDetail: { fontSize: 12 },
  reservationStatus: { fontSize: 11, fontWeight: '800' },
  emptyCard: { borderRadius: 17, padding: 22, alignItems: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '900', marginTop: 10 },
  emptyText: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 5 },
  emptyLink: { fontSize: 12, fontWeight: '900', marginTop: 12 },
  guestNote: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderRadius: 14, marginTop: 24 },
  guestText: { flex: 1, fontSize: 12, lineHeight: 18 },
  footer: { textAlign: 'center', fontSize: 11, marginTop: 28 },
});
