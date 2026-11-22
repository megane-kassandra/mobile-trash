import { RoleGuard } from '@/components/role-guard';
import { ClientPage } from '@/components/role-pages';

export default function ClientCollectes() {
  return <RoleGuard roles={['CLIENT']}><ClientPage view="collectes" /></RoleGuard>;
}
