import { RoleGuard } from '@/components/role-guard';
import { ClientPage } from '@/components/role-pages';

export default function ClientHistorique() {
  return <RoleGuard roles={['CLIENT']}><ClientPage view="historique" /></RoleGuard>;
}
