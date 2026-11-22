import { RoleGuard } from '@/components/role-guard';
import { ClientPage } from '@/components/role-pages';

export default function ClientDashboard() {
  return <RoleGuard roles={['CLIENT']}><ClientPage view="dashboard" /></RoleGuard>;
}
