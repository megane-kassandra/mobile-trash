import { RoleGuard } from '@/components/role-guard';
import { CollectorPage } from '@/components/role-pages';

export default function CollectorCollections() {
  return <RoleGuard roles={['COLLECTEUR']}><CollectorPage view="collections" /></RoleGuard>;
}
