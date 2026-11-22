import { RoleGuard } from '@/components/role-guard';
import { ClientPage } from '@/components/role-pages';

export default function ClientReservations() {
  return <RoleGuard roles={['CLIENT']}><ClientPage view="reservations" /></RoleGuard>;
}
