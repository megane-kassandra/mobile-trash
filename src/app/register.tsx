import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import type { PublicAccountRole } from '@/types/models';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { width } = useWindowDimensions();
  const colors = Colors.light;
  const [role, setRole] = useState<PublicAccountRole>('CLIENT');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    try {
      await register({ firstName, lastName, phone, address, password, confirmPassword, role });
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Inscription impossible.');
    }
  };

  const fields: Array<{ label: string; value: string; set: (value: string) => void; phone?: boolean }> = [
    { label: 'Prénom', value: firstName, set: setFirstName },
    { label: 'Nom', value: lastName, set: setLastName },
    { label: 'Téléphone', value: phone, set: setPhone, phone: true },
    { label: 'Adresse', value: address, set: setAddress },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, width >= 900 && styles.desktopContent]}>
        <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={22} color={colors.text} /></Pressable>
        <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
          <Text style={[styles.title, { color: colors.text }]}>Créer un compte</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Choisissez votre rôle parmi les comptes autorisés.</Text>

          <Text style={[styles.label, { color: colors.text }]}>Type de compte</Text>
          <View style={styles.roles}>
            {(['CLIENT', 'COLLECTEUR'] as PublicAccountRole[]).map((item) => (
              <Pressable key={item} onPress={() => setRole(item)} style={[styles.roleButton, { borderColor: role === item ? colors.primary : colors.backgroundSelected, backgroundColor: role === item ? colors.backgroundSelected : colors.background }]}>
                <Ionicons name={item === 'CLIENT' ? 'person-outline' : 'bicycle-outline'} size={20} color={role === item ? colors.primary : colors.textSecondary} />
                <Text style={[styles.roleText, { color: role === item ? colors.primary : colors.text }]}>{item === 'CLIENT' ? 'Client' : 'Éboueur'}</Text>
              </Pressable>
            ))}
          </View>

          {fields.map((field) => (
            <View key={field.label}>
              <Text style={[styles.label, { color: colors.text }]}>{field.label}</Text>
              <TextInput value={field.value} onChangeText={field.set} keyboardType={field.phone ? 'phone-pad' : 'default'} placeholder={field.label} placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]} />
            </View>
          ))}

          <Text style={[styles.label, { color: colors.text }]}>Mot de passe</Text>
          <TextInput value={password} onChangeText={setPassword} secureTextEntry style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]} />
          <Text style={[styles.label, { color: colors.text }]}>Confirmation du mot de passe</Text>
          <TextInput value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]} />

          {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}
          <Pressable onPress={submit} style={[styles.button, { backgroundColor: colors.primary }]}><Text style={styles.buttonText}>Créer mon compte</Text></Pressable>
          <Pressable onPress={() => router.push('/login')} style={styles.link}><Text style={[styles.linkText, { color: colors.primary }]}>Déjà inscrit ? Se connecter</Text></Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, content: { alignItems: 'center', padding: 20 }, desktopContent: { paddingVertical: 48 }, back: { alignSelf: 'flex-start', width: 44, height: 44, alignItems: 'center', justifyContent: 'center', maxWidth: 580 },
  card: { width: '100%', maxWidth: 580, borderRadius: 24, padding: 24 }, title: { fontSize: 27, fontWeight: '900', marginBottom: 6 }, subtitle: { fontSize: 14, marginBottom: 20 }, label: { fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 12 },
  roles: { flexDirection: 'row', gap: 10 }, roleButton: { flex: 1, height: 56, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }, roleText: { fontWeight: '800' },
  input: { height: 52, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14 }, error: { backgroundColor: '#FCE8E8', padding: 12, borderRadius: 10, marginTop: 14 }, errorText: { color: '#B83232', fontSize: 13 },
  button: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 20 }, buttonText: { color: '#fff', fontWeight: '800' }, link: { alignItems: 'center', marginTop: 16 }, linkText: { fontWeight: '700' },
});
