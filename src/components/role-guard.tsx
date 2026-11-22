import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import type { UserRole } from '@/types/models';

export function RoleGuard({
  roles,
  children,
}: {
  roles: readonly UserRole[];
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/');
      return;
    }
    if (!roles.includes(user.role)) router.replace('/');
  }, [loading, roles, router, user]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.background }}>
        <ActivityIndicator color={Colors.light.primary} />
      </View>
    );
  }

  if (!user || !roles.includes(user.role)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.background }}>
        <Text style={{ color: Colors.light.textSecondary }}>Redirection...</Text>
      </View>
    );
  }

  return <>{children}</>;
}
