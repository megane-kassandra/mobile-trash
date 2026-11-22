import { RoleGuard } from '@/components/role-guard';
import { CollectorPage } from '@/components/role-pages';

export default function CollectorReservations() {
  return <RoleGuard roles={['COLLECTEUR']}><CollectorPage view="reservations" /></RoleGuard>;
}
