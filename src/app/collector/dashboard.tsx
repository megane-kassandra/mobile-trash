import { RoleGuard } from '@/components/role-guard';
import { CollectorPage } from '@/components/role-pages';

export default function CollectorDashboard() {
  return <RoleGuard roles={['COLLECTEUR']}><CollectorPage view="dashboard" /></RoleGuard>;
}
