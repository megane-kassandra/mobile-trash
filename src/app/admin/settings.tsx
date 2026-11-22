import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { RoleGuard } from '@/components/role-guard';
import { RoleShell } from '@/components/role-navigation';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { getAppDatabase, updateAppSettings } from '@/services/data-service';
import type { AppSettings } from '@/types/models';

function SettingsForm() {
  const colors = Colors.light;
  const { user } = useAuth();
  const { showToast } = useToast();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [message, setMessage] = useState('');

  const refresh = useCallback(async () => {
    try {
      setSettings((await getAppDatabase()).settings);
    } catch {
      setMessage('Impossible de charger les paramètres.');
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const save = async () => {
    if (!settings || !user) return;
    try {
      setSettings(await updateAppSettings(user.id, settings));
      setMessage('Paramètres enregistrés.');
      showToast('Paramètres enregistrés.', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Enregistrement impossible.';
      setMessage(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  return (
    <RoleShell>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: colors.text }]}>Paramètres</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Configuration générale de Collecte+.</Text>
        <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
          <Text style={[styles.label, { color: colors.text }]}>Nom de l’application</Text>
          <TextInput value={settings?.appName ?? ''} onChangeText={(appName) => setSettings((current) => current ? { ...current, appName } : current)} placeholder="Collecte+" placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]} />

          <Text style={[styles.label, { color: colors.text }]}>E-mail d’assistance</Text>
          <TextInput value={settings?.supportEmail ?? ''} onChangeText={(supportEmail) => setSettings((current) => current ? { ...current, supportEmail } : current)} keyboardType="email-address" autoCapitalize="none" placeholder="support@exemple.cm" placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]} />

          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: settings?.allowPublicRegistration ?? false }}
            onPress={() => setSettings((current) => current ? { ...current, allowPublicRegistration: !current.allowPublicRegistration } : current)}
            style={styles.toggleRow}
          >
            <View style={styles.toggleCopy}>
              <Text style={[styles.toggleTitle, { color: colors.text }]}>Inscriptions ouvertes</Text>
              <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>Autoriser la création de comptes client et collecteur.</Text>
            </View>
            <View style={[styles.toggle, { backgroundColor: settings?.allowPublicRegistration ? colors.primary : '#AAB6AF' }]}>
              <View style={[styles.toggleThumb, settings?.allowPublicRegistration && styles.toggleThumbOn]} />
            </View>
          </Pressable>

          {message ? <Text accessibilityLiveRegion="polite" style={[styles.message, { color: message.includes('enregistrés') ? colors.primary : '#B83232' }]}>{message}</Text> : null}
          <Pressable disabled={!settings} onPress={() => void save()} style={[styles.button, { backgroundColor: colors.primary, opacity: settings ? 1 : 0.5 }]}>
            <Ionicons name="save-outline" size={18} color="#FFFFFF" />
            <Text style={styles.buttonText}>Enregistrer les paramètres</Text>
          </Pressable>
        </View>
      </ScrollView>
    </RoleShell>
  );
}

export default function AdminSettings() {
  return <RoleGuard roles={['ADMIN']}><SettingsForm /></RoleGuard>;
}

const styles = StyleSheet.create({
  scroll: { maxWidth: 1000, width: '100%', alignSelf: 'center', padding: 24, paddingBottom: 110 },
  title: { fontSize: 28, fontWeight: '900' },
  subtitle: { fontSize: 14, marginTop: 6, marginBottom: 24 },
  card: { borderRadius: 18, padding: 18 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 10 },
  input: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 18, marginTop: 8 },
  toggleCopy: { flex: 1 },
  toggleTitle: { fontSize: 14, fontWeight: '800' },
  toggleDescription: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  toggle: { width: 48, height: 28, borderRadius: 14, padding: 3, justifyContent: 'center' },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF' },
  toggleThumbOn: { alignSelf: 'flex-end' },
  message: { fontSize: 13, marginTop: 8 },
  button: { minHeight: 50, borderRadius: 12, marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  buttonText: { color: '#FFFFFF', fontWeight: '800' },
});
