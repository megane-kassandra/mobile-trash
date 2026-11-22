import { RoleGuard } from '@/components/role-guard';
import { CollectorPage } from '@/components/role-pages';

export default function CollectorPublish() {
  return <RoleGuard roles={['COLLECTEUR']}><CollectorPage view="publish" /></RoleGuard>;
}
