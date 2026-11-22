import { RoleGuard } from '@/components/role-guard';
import { AdminPage } from '@/components/role-pages';

export default function AdminDashboard() {
  return <RoleGuard roles={['ADMIN']}><AdminPage view="dashboard" /></RoleGuard>;
}
