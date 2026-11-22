import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { getRoleHomeRoute, getRoleLabel } from '@/services/role-service';

export default function ExploreScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colors = Colors.light;
  const actions = user?.role === 'ADMIN'
    ? [
        { label: 'Utilisateurs', detail: 'Gérer les comptes et les accès', icon: 'people-outline' as const, route: '/admin/users' as const },
        { label: 'Collectes', detail: 'Consulter les tournées publiées', icon: 'calendar-outline' as const, route: '/admin/collections' as const },
        { label: 'Signalements', detail: 'Traiter les demandes d’assistance', icon: 'alert-circle-outline' as const, route: '/admin/reports' as const },
      ]
    : user?.role === 'COLLECTEUR'
      ? [
          { label: 'Publier une collecte', detail: 'Proposer un nouveau créneau', icon: 'add-circle-outline' as const, route: '/collector/publish' as const },
          { label: 'Mes collectes', detail: 'Gérer vos tournées publiées', icon: 'calendar-outline' as const, route: '/collector/collections' as const },
          { label: 'Réservations reçues', detail: 'Voir les clients inscrits', icon: 'people-outline' as const, route: '/collector/reservations' as const },
        ]
      : user
        ? [
            { label: 'Collectes disponibles', detail: 'Trouver un créneau dans votre quartier', icon: 'search-outline' as const, route: '/client/collectes' as const },
            { label: 'Mes réservations', detail: 'Suivre ou annuler une demande', icon: 'calendar-outline' as const, route: '/client/reservations' as const },
            { label: 'Historique', detail: 'Retrouver vos collectes passées', icon: 'time-outline' as const, route: '/client/historique' as const },
          ]
        : [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>{user ? getRoleLabel(user.role).toUpperCase() : 'COLLECTE+'}</Text>
          <Text style={[styles.title, { color: colors.text }]}>Explorer</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Retrouvez les actions utiles à votre espace.</Text>
        </View>

        {user ? (
          <Pressable onPress={() => router.push(getRoleHomeRoute(user.role))} style={[styles.dashboard, { backgroundColor: colors.primary }]}>
            <Ionicons name="speedometer-outline" size={22} color="#FFFFFF" />
            <Text style={styles.dashboardText}>Ouvrir mon tableau de bord</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>
        ) : (
          <View style={[styles.guestCard, { backgroundColor: colors.backgroundElement }]}>
            <Text style={[styles.guestText, { color: colors.text }]}>Connectez-vous pour accéder aux services et à votre espace personnel.</Text>
            <View style={styles.guestActions}>
              <Pressable onPress={() => router.push('/login')} style={[styles.guestButton, { backgroundColor: colors.primary }]}><Text style={styles.guestButtonText}>Connexion</Text></Pressable>
              <Pressable onPress={() => router.push('/register')} style={[styles.guestButton, { backgroundColor: colors.background }]}><Text style={[styles.guestButtonText, { color: colors.primary }]}>Inscription</Text></Pressable>
            </View>
          </View>
        )}

        <View style={styles.list}>
          {actions.map((action) => (
            <Pressable key={action.label} onPress={() => router.push(action.route)} style={({ pressed }) => [styles.action, { backgroundColor: colors.backgroundElement }, pressed && styles.pressed]}>
              <View style={[styles.icon, { backgroundColor: colors.background }]}><Ionicons name={action.icon} size={22} color={colors.primary} /></View>
              <View style={styles.actionText}>
                <Text style={[styles.actionTitle, { color: colors.text }]}>{action.label}</Text>
                <Text style={[styles.actionDetail, { color: colors.textSecondary }]}>{action.detail}</Text>
              </View>
              <Ionicons name="chevron-forward" size={19} color={colors.textSecondary} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 22, paddingBottom: 40 },
  heading: { marginTop: 12, marginBottom: 23 },
  eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginBottom: 7 },
  title: { fontSize: 29, fontWeight: '900' },
  subtitle: { fontSize: 14, marginTop: 6 },
  dashboard: { minHeight: 56, borderRadius: 14, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 20 },
  dashboardText: { flex: 1, color: '#FFFFFF', fontWeight: '800' },
  guestCard: { padding: 18, borderRadius: 16, marginBottom: 20 },
  guestText: { fontSize: 14, lineHeight: 21, fontWeight: '700' },
  guestActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  guestButton: { flex: 1, minHeight: 45, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  guestButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  list: { gap: 10 },
  action: { minHeight: 74, borderRadius: 15, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  actionText: { flex: 1 },
  actionTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  actionDetail: { fontSize: 12 },
  pressed: { opacity: 0.75 },
});
