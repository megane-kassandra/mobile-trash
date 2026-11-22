import { RoleGuard } from '@/components/role-guard';
import { AdminPage } from '@/components/role-pages';

export default function AdminReservations() {
  return <RoleGuard roles={['ADMIN']}><AdminPage view="reservations" /></RoleGuard>;
}
