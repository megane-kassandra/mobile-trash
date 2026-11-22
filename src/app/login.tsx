import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { width } = useWindowDimensions();
  const colors = Colors.light;
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    try {
      await login({ phone: phone.trim(), password });
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connexion impossible.');
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, width >= 900 && styles.desktopContent]}>
        <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={22} color={colors.text} /></Pressable>
        <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
          <View style={[styles.logo, { backgroundColor: colors.primary }]}><Ionicons name="leaf" size={28} color="#fff" /></View>
          <Text style={[styles.title, { color: colors.text }]}>Connexion</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Accédez à votre espace Collecte+</Text>

          <Text style={[styles.label, { color: colors.text }]}>Téléphone</Text>
          <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Ex. 690000001" placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]} />
          <Text style={[styles.label, { color: colors.text }]}>Mot de passe</Text>
          <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Votre mot de passe" placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]} />

          {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}
          <Pressable onPress={submit} style={[styles.button, { backgroundColor: colors.primary }]}><Text style={styles.buttonText}>Se connecter</Text></Pressable>
          <Pressable onPress={() => router.push('/register')} style={styles.link}><Text style={[styles.linkText, { color: colors.primary }]}>Pas encore de compte ? S’inscrire</Text></Pressable>

          <View style={[styles.demo, { backgroundColor: colors.background }]}>
            <Text style={[styles.demoTitle, { color: colors.text }]}>Comptes de démonstration</Text>
            <Text style={[styles.demoText, { color: colors.textSecondary }]}>CLIENT · 690000001 · 123456</Text>
            <Text style={[styles.demoText, { color: colors.textSecondary }]}>COLLECTEUR · 690000002 · 123456</Text>
            <Text style={[styles.demoText, { color: colors.textSecondary }]}>ADMIN · 690000000 · 123456</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, content: { minHeight: '100%', alignItems: 'center', justifyContent: 'center', padding: 20 }, desktopContent: { paddingVertical: 48 },
  back: { alignSelf: 'flex-start', width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, card: { width: '100%', maxWidth: 480, borderRadius: 24, padding: 24 },
  logo: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }, title: { fontSize: 27, fontWeight: '900', marginBottom: 6 }, subtitle: { fontSize: 14, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 12 }, input: { height: 52, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14 }, error: { backgroundColor: '#FCE8E8', padding: 12, borderRadius: 10, marginTop: 14 }, errorText: { color: '#B83232', fontSize: 13 },
  button: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 20 }, buttonText: { color: '#fff', fontWeight: '800' }, link: { alignItems: 'center', marginTop: 16 }, linkText: { fontWeight: '700' },
  demo: { marginTop: 20, borderRadius: 12, padding: 12 }, demoTitle: { fontSize: 12, fontWeight: '800', marginBottom: 6 }, demoText: { fontSize: 11, marginTop: 2 },
});
