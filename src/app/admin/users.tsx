import { RoleGuard } from '@/components/role-guard';
import { AdminPage } from '@/components/role-pages';

export default function AdminUsers() {
  return <RoleGuard roles={['ADMIN']}><AdminPage view="users" /></RoleGuard>;
}
