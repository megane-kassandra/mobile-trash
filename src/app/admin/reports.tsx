import { RoleGuard } from '@/components/role-guard';
import { AdminPage } from '@/components/role-pages';

export default function AdminReports() {
  return <RoleGuard roles={['ADMIN']}><AdminPage view="reports" /></RoleGuard>;
}
