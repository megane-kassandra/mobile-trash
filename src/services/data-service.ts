import { loadDatabase, saveDatabase } from '@/services/storage';
import type {
    AppDatabase,
    CreateCollectionInput,
    PlatformStatistics,
    ReportStatus,
    Reservation,
    ReservationStatus,
    User,
    WasteCollection,
} from '@/types/models';

export class DomainRuleError extends Error {}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function isValidTime(value: string): boolean {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function collectionStartsAt(date: string, time: string): number | null {
  if (!isValidDate(date) || !isValidTime(time)) return null;
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute).getTime();
}

function isActiveReservation(reservation: Reservation): boolean {
  return reservation.status !== 'ANNULEE' && reservation.status !== 'TERMINEE';
}

function uniqueId(prefix: string, existingIds: string[]): string {
  let id = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  while (existingIds.includes(id)) id = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return id;
}

export async function getAppDatabase(): Promise<AppDatabase> {
  return loadDatabase();
}

export async function getPlatformStatistics(): Promise<PlatformStatistics> {
  const database = await loadDatabase();

  return {
    totalClients: database.users.filter((user) => user.role === 'CLIENT').length,
    totalCollectors: database.users.filter((user) => user.role === 'COLLECTEUR').length,
    totalCollections: database.collections.filter((item) => item.status !== 'CANCELLED' && item.status !== 'DISABLED').length,
    totalReservations: database.reservations.filter(isActiveReservation).length,
    completedCollections: database.collections.filter((item) => item.status === 'COMPLETED').length,
    pendingReservations: database.reservations.filter((item) => item.status === 'EN_ATTENTE').length,
  };
}

export async function updateAppSettings(
  adminId: string,
  updates: AppDatabase['settings'],
): Promise<AppDatabase['settings']> {
  const database = await loadDatabase();
  const admin = database.users.find((user) => user.id === adminId);
  if (!admin || admin.role !== 'ADMIN' || admin.status !== 'ACTIVE') {
    throw new DomainRuleError('Action réservée à un administrateur actif.');
  }
  const appName = updates.appName.trim();
  const supportEmail = updates.supportEmail.trim().toLowerCase();
  if (!appName) throw new DomainRuleError('Le nom de l’application est obligatoire.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)) {
    throw new DomainRuleError('L’adresse e-mail d’assistance est invalide.');
  }
  const settings = { ...updates, appName, supportEmail };
  await saveDatabase({ ...database, settings });
  return settings;
}

export async function getReservationsForCollection(collectionId: string): Promise<Reservation[]> {
  const database = await loadDatabase();
  return database.reservations.filter((reservation) => reservation.collectionId === collectionId);
}

export async function getActiveReservationCount(collectionId: string): Promise<number> {
  const reservations = await getReservationsForCollection(collectionId);
  return reservations.filter(isActiveReservation).length;
}

export async function createCollection(input: CreateCollectionInput): Promise<WasteCollection> {
  const database = await loadDatabase();
  const collector = database.users.find((user) => user.id === input.collectorId);

  if (!collector || collector.role !== 'COLLECTEUR' || collector.status !== 'ACTIVE') {
    throw new DomainRuleError('Seul un éboueur actif peut publier une collecte.');
  }
  if (!input.location.trim() || !input.locationDetails.trim()) {
    throw new DomainRuleError('Le lieu et les indications de localisation sont obligatoires.');
  }
  const collectionDateTime = collectionStartsAt(input.date, input.startTime);
  if (collectionDateTime === null || !isValidTime(input.endTime) || input.endTime <= input.startTime) {
    throw new DomainRuleError('La date et les horaires de collecte sont invalides.');
  }
  if (collectionDateTime <= Date.now()) {
    throw new DomainRuleError('Une collecte ne peut pas être publiée dans le passé.');
  }
  if (!Number.isInteger(input.maxCapacity) || input.maxCapacity < 1) {
    throw new DomainRuleError('La capacité maximale doit être supérieure à zéro.');
  }

  const now = new Date().toISOString();
  const collection: WasteCollection = {
    id: uniqueId('collection', database.collections.map((item) => item.id)),
    collectorId: input.collectorId,
    location: input.location.trim(),
    locationDetails: input.locationDetails.trim(),
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    maxCapacity: input.maxCapacity,
    description: input.description?.trim() || undefined,
    status: 'PUBLISHED',
    createdAt: now,
    updatedAt: now,
  };

  await saveDatabase({ ...database, collections: [...database.collections, collection] });
  return collection;
}

export async function updateCollection(
  collectionId: string,
  collectorId: string,
  updates: Partial<Omit<WasteCollection, 'id' | 'collectorId' | 'createdAt' | 'updatedAt'>>,
): Promise<WasteCollection> {
  const database = await loadDatabase();
  const existing = database.collections.find((item) => item.id === collectionId);

  if (!existing) throw new DomainRuleError('Collecte introuvable.');
  const collector = database.users.find((user) => user.id === collectorId);
  if (!collector || collector.role !== 'COLLECTEUR' || collector.status !== 'ACTIVE') {
    throw new DomainRuleError('Seul un éboueur actif peut modifier une collecte.');
  }
  if (existing.collectorId !== collectorId) {
    throw new DomainRuleError('Cette collecte appartient à un autre éboueur.');
  }

  if (updates.date || updates.startTime || updates.endTime) {
    const date = updates.date ?? existing.date;
    const startTime = updates.startTime ?? existing.startTime;
    const endTime = updates.endTime ?? existing.endTime;
    const start = collectionStartsAt(date, startTime);
    if (start === null || !isValidTime(endTime) || endTime <= startTime) {
      throw new DomainRuleError('La date et les horaires de collecte sont invalides.');
    }
    if (start <= Date.now()) {
      throw new DomainRuleError('Une collecte ne peut pas être déplacée dans le passé.');
    }
  }
  if (updates.maxCapacity !== undefined && (!Number.isInteger(updates.maxCapacity) || updates.maxCapacity < 1)) {
    throw new DomainRuleError('La capacité maximale doit être supérieure à zéro.');
  }
  if (updates.maxCapacity !== undefined) {
    const activeCount = database.reservations.filter((item) => item.collectionId === collectionId && isActiveReservation(item)).length;
    if (updates.maxCapacity < activeCount) {
      throw new DomainRuleError('La capacité ne peut pas être inférieure aux réservations déjà actives.');
    }
  }

  const updated: WasteCollection = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await saveDatabase({
    ...database,
    collections: database.collections.map((item) => item.id === collectionId ? updated : item),
  });
  return updated;
}

export async function reserveCollection(
  collectionId: string,
  clientId: string,
): Promise<Reservation> {
  const database = await loadDatabase();
  const client = database.users.find((user) => user.id === clientId);
  const collection = database.collections.find((item) => item.id === collectionId);

  if (!client || client.role !== 'CLIENT' || client.status !== 'ACTIVE') {
    throw new DomainRuleError('Seul un client actif peut réserver une collecte.');
  }
  if (!collection || collection.status !== 'PUBLISHED') {
    throw new DomainRuleError('Cette collecte n’est plus disponible.');
  }
  const collector = database.users.find((user) => user.id === collection.collectorId);
  if (!collector || collector.role !== 'COLLECTEUR' || collector.status !== 'ACTIVE') {
    throw new DomainRuleError('Le collecteur de cette collecte n’est plus actif.');
  }
  const collectionDateTime = collectionStartsAt(collection.date, collection.startTime);
  if (collectionDateTime === null || collectionDateTime <= Date.now()) {
    throw new DomainRuleError('Les collectes passées ne peuvent pas recevoir de réservation.');
  }

  const hasDuplicate = database.reservations.some((reservation) =>
    reservation.collectionId === collectionId
      && reservation.clientId === clientId
      && isActiveReservation(reservation),
  );
  if (hasDuplicate) {
    throw new DomainRuleError('Vous avez déjà réservé cette collecte.');
  }

  const activeCount = database.reservations.filter((reservation) =>
    reservation.collectionId === collectionId && isActiveReservation(reservation),
  ).length;
  if (activeCount >= collection.maxCapacity) {
    throw new DomainRuleError('La capacité maximale de cette collecte est atteinte.');
  }

  const now = new Date().toISOString();
  const reservation: Reservation = {
    id: uniqueId('reservation', database.reservations.map((item) => item.id)),
    collectionId,
    clientId,
    status: 'EN_ATTENTE',
    createdAt: now,
    updatedAt: now,
  };

  await saveDatabase({
    ...database,
    reservations: [...database.reservations, reservation],
  });
  return reservation;
}

export async function updateReservationStatus(
  reservationId: string,
  status: ReservationStatus,
  adminId: string,
): Promise<Reservation> {
  const database = await loadDatabase();
  const admin = database.users.find((user) => user.id === adminId);
  if (!admin || admin.role !== 'ADMIN' || admin.status !== 'ACTIVE') {
    throw new DomainRuleError('Action réservée à un administrateur actif.');
  }
  const existing = database.reservations.find((item) => item.id === reservationId);
  if (!existing) throw new DomainRuleError('Réservation introuvable.');

  if (existing.status !== status) {
    const allowedTransitions: Record<ReservationStatus, readonly ReservationStatus[]> = {
      EN_ATTENTE: ['CONFIRMEE', 'ANNULEE'],
      CONFIRMEE: ['TERMINEE', 'ANNULEE'],
      ANNULEE: [],
      TERMINEE: [],
    };
    if (!allowedTransitions[existing.status].includes(status)) {
      throw new DomainRuleError('Cette transition de réservation n’est pas autorisée.');
    }
    if (status === 'CONFIRMEE') {
      const collection = database.collections.find((item) => item.id === existing.collectionId);
      const startsAt = collection && collectionStartsAt(collection.date, collection.startTime);
      if (!collection || collection.status !== 'PUBLISHED' || startsAt == null || startsAt <= Date.now()) {
        throw new DomainRuleError('Seule une réservation d’une collecte publiée à venir peut être confirmée.');
      }
    }
  }

  const updated: Reservation = {
    ...existing,
    status,
    updatedAt: new Date().toISOString(),
  };

  await saveDatabase({
    ...database,
    reservations: database.reservations.map((item) => item.id === reservationId ? updated : item),
  });
  return updated;
}

export async function cancelReservation(reservationId: string, clientId: string): Promise<Reservation> {
  const database = await loadDatabase();
  const client = database.users.find((user) => user.id === clientId);
  if (!client || client.role !== 'CLIENT' || client.status !== 'ACTIVE') {
    throw new DomainRuleError('Seul un client actif peut annuler une réservation.');
  }
  const existing = database.reservations.find((item) => item.id === reservationId);

  if (!existing) throw new DomainRuleError('Réservation introuvable.');
  if (existing.clientId !== clientId) {
    throw new DomainRuleError('Cette réservation appartient à un autre client.');
  }
  if (!isActiveReservation(existing)) throw new DomainRuleError('Cette réservation ne peut plus être annulée.');

  const updated = { ...existing, status: 'ANNULEE' as const, updatedAt: new Date().toISOString() };
  await saveDatabase({
    ...database,
    reservations: database.reservations.map((item) => item.id === reservationId ? updated : item),
  });
  return updated;
}

export async function setUserStatus(
  adminId: string,
  targetUserId: string,
  status: User['status'],
): Promise<User> {
  const database = await loadDatabase();
  const admin = database.users.find((user) => user.id === adminId);

  if (!admin || admin.role !== 'ADMIN' || admin.status !== 'ACTIVE') {
    throw new DomainRuleError('Action réservée à un administrateur actif.');
  }
  if (targetUserId === adminId) {
    throw new DomainRuleError('Un administrateur ne peut pas modifier son propre compte ici.');
  }

  const target = database.users.find((user) => user.id === targetUserId);
  if (!target) throw new DomainRuleError('Utilisateur introuvable.');

  const updated = { ...target, status };
  await saveDatabase({
    ...database,
    users: database.users.map((user) => user.id === targetUserId ? updated : user),
  });
  return updated;
}

export async function setCollectionStatus(
  adminId: string,
  collectionId: string,
  status: WasteCollection['status'],
): Promise<WasteCollection> {
  const database = await loadDatabase();
  const admin = database.users.find((user) => user.id === adminId);
  if (!admin || admin.role !== 'ADMIN' || admin.status !== 'ACTIVE') {
    throw new DomainRuleError('Action réservée à un administrateur actif.');
  }

  const collection = database.collections.find((item) => item.id === collectionId);
  if (!collection) throw new DomainRuleError('Collecte introuvable.');

  const updated = { ...collection, status, updatedAt: new Date().toISOString() };
  await saveDatabase({
    ...database,
    collections: database.collections.map((item) => item.id === collectionId ? updated : item),
  });
  return updated;
}

export async function setReportStatus(
  adminId: string,
  reportId: string,
  status: ReportStatus,
): Promise<AppDatabase['reports'][number]> {
  const database = await loadDatabase();
  const admin = database.users.find((user) => user.id === adminId);
  if (!admin || admin.role !== 'ADMIN' || admin.status !== 'ACTIVE') {
    throw new DomainRuleError('Action réservée à un administrateur actif.');
  }

  const report = database.reports.find((item) => item.id === reportId);
  if (!report) throw new DomainRuleError('Signalement introuvable.');

  const updated = { ...report, status, updatedAt: new Date().toISOString() };
  await saveDatabase({
    ...database,
    reports: database.reports.map((item) => item.id === reportId ? updated : item),
  });
  return updated;
}

export async function updateUserProfile(
  userId: string,
  updates: Pick<User, 'firstName' | 'lastName' | 'phone' | 'address'>,
): Promise<User> {
  const database = await loadDatabase();
  const existing = database.users.find((user) => user.id === userId);
  if (!existing) throw new DomainRuleError('Utilisateur introuvable.');

  const phone = updates.phone.trim();
  if (!updates.firstName.trim() || !updates.lastName.trim() || !updates.address.trim()) {
    throw new DomainRuleError('Le prénom, le nom et l’adresse sont obligatoires.');
  }
  if (!/^\+?[0-9]{8,15}$/.test(phone)) {
    throw new DomainRuleError('Le numéro de téléphone doit contenir 8 à 15 chiffres.');
  }

  if (database.users.some((user) => user.id !== userId && user.phone === phone)) {
    throw new DomainRuleError('Ce numéro de téléphone est déjà utilisé.');
  }

  const updated: User = {
    ...existing,
    firstName: updates.firstName.trim(),
    lastName: updates.lastName.trim(),
    phone,
    address: updates.address.trim(),
  };

  await saveDatabase({
    ...database,
    users: database.users.map((user) => user.id === userId ? updated : user),
  });
  return updated;
}

export async function deleteCollection(
  collectionId: string,
  collectorId: string,
): Promise<void> {
  const database = await loadDatabase();
  const collection = database.collections.find((item) => item.id === collectionId);
  if (!collection) throw new DomainRuleError('Collecte introuvable.');
  if (collection.collectorId !== collectorId) {
    throw new DomainRuleError('Cette collecte appartient à un autre éboueur.');
  }

  const activeReservations = database.reservations.filter((item) =>
    item.collectionId === collectionId && item.status !== 'ANNULEE',
  );
  if (activeReservations.length > 0) {
    throw new DomainRuleError('Une collecte avec des réservations actives ne peut pas être supprimée.');
  }

  await saveDatabase({
    ...database,
    collections: database.collections.filter((item) => item.id !== collectionId),
  });
}

export async function createReport(input: {
  reporterId: string;
  category: 'COLLECTE' | 'RESERVATION' | 'COMPTE' | 'AUTRE';
  message: string;
  collectionId?: string;
  reservationId?: string;
  subjectUserId?: string;
}): Promise<AppDatabase['reports'][number]> {
  const database = await loadDatabase();
  const reporter = database.users.find((user) => user.id === input.reporterId);
  if (!reporter || reporter.status !== 'ACTIVE') {
    throw new DomainRuleError('Seul un utilisateur actif peut envoyer un signalement.');
  }
  if (!input.message.trim()) throw new DomainRuleError('Veuillez décrire le problème rencontré.');

  const now = new Date().toISOString();
  const report: AppDatabase['reports'][number] = {
    id: `report-${Date.now()}`,
    reporterId: input.reporterId,
    subjectUserId: input.subjectUserId,
    collectionId: input.collectionId,
    reservationId: input.reservationId,
    category: input.category,
    message: input.message.trim(),
    status: 'NOUVEAU',
    createdAt: now,
    updatedAt: now,
  };

  await saveDatabase({ ...database, reports: [...database.reports, report] });
  return report;
}
