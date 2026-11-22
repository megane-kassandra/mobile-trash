export type UserRole = 'CLIENT' | 'COLLECTEUR' | 'ADMIN';
export type PublicAccountRole = Extract<UserRole, 'CLIENT' | 'COLLECTEUR'>;

export type UserAccountStatus = 'ACTIVE' | 'DISABLED';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  role: UserRole;
  status: UserAccountStatus;
  createdAt: string;
  /**
   * Demo-only credential marker. Never expose this field to UI components.
   * Production authentication must be delegated to a secure backend.
   */
  credentialHash: string;
}

export interface PublicUserProfile
  extends Omit<User, 'id' | 'role' | 'status' | 'createdAt' | 'credentialHash'> {}

export type CollectionStatus =
  | 'PUBLISHED'
  | 'DISABLED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface WasteCollection {
  id: string;
  collectorId: string;
  location: string;
  locationDetails: string;
  date: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  description?: string;
  status: CollectionStatus;
  createdAt: string;
  updatedAt: string;
}

export type ReservationStatus =
  | 'EN_ATTENTE'
  | 'CONFIRMEE'
  | 'ANNULEE'
  | 'TERMINEE';

export interface Reservation {
  id: string;
  collectionId: string;
  clientId: string;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
}

export type ReportStatus = 'NOUVEAU' | 'EN_COURS' | 'RESOLU';

export interface Report {
  id: string;
  reporterId: string;
  subjectUserId?: string;
  collectionId?: string;
  reservationId?: string;
  category: 'COLLECTE' | 'RESERVATION' | 'COMPTE' | 'AUTRE';
  message: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  appName: string;
  supportEmail: string;
  allowPublicRegistration: boolean;
}

export interface AppDatabase {
  version: number;
  users: User[];
  collections: WasteCollection[];
  reservations: Reservation[];
  reports: Report[];
  settings: AppSettings;
}

export interface PublicRegistrationInput {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  password: string;
  confirmPassword: string;
  role: PublicAccountRole;
}

export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface CreateCollectionInput {
  collectorId: string;
  location: string;
  locationDetails: string;
  date: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  description?: string;
}

export interface PlatformStatistics {
  totalClients: number;
  totalCollectors: number;
  totalCollections: number;
  totalReservations: number;
  completedCollections: number;
  pendingReservations: number;
}
