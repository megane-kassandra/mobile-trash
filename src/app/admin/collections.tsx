import { RoleGuard } from '@/components/role-guard';
import { AdminPage } from '@/components/role-pages';

export default function AdminCollections() {
  return <RoleGuard roles={['ADMIN']}><AdminPage view="collections" /></RoleGuard>;
}
