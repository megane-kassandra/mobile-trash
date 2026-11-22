import { RoleGuard } from '@/components/role-guard';
import { ProfilePage } from '@/components/role-pages';

export default function ProfileEditRoute() {
  return (
    <RoleGuard roles={['CLIENT', 'COLLECTEUR', 'ADMIN']}>
      <ProfilePage />
    </RoleGuard>
  );
}
