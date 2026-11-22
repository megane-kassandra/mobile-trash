import { Redirect } from 'expo-router';

import { useAuth } from '@/context/auth-context';

export default function TrackingAlias() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Redirect href={user?.role === 'CLIENT' ? '/client/reservations' : '/'} />;
}
