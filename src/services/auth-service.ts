import {
    clearSession,
    loadDatabase,
    loadSessionUserId,
    saveDatabase,
    saveSessionUserId,
} from '@/services/storage';
import type {
    LoginCredentials,
    PublicAccountRole,
    PublicRegistrationInput,
    User,
} from '@/types/models';

export class AuthValidationError extends Error {}

export function validatePublicRegistration(input: PublicRegistrationInput): string[] {
  const errors: string[] = [];

  if (!input.firstName.trim()) errors.push('Le prénom est obligatoire.');
  if (!input.lastName.trim()) errors.push('Le nom est obligatoire.');
  if (!input.phone.trim()) errors.push('Le numéro de téléphone est obligatoire.');
  if (!/^\+?[0-9]{8,15}$/.test(input.phone.trim())) {
    errors.push('Le numéro de téléphone doit contenir 8 à 15 chiffres.');
  }
  if (!input.address.trim()) errors.push('L’adresse est obligatoire.');
  if (!input.password) errors.push('Le mot de passe est obligatoire.');
  if (input.password.length < 6) {
    errors.push('Le mot de passe doit contenir au moins 6 caractères.');
  }
  if (input.password !== input.confirmPassword) {
    errors.push('Les mots de passe ne correspondent pas.');
  }
  if (input.role !== 'CLIENT' && input.role !== 'COLLECTEUR') {
    errors.push('Seuls les comptes Client et Éboueur peuvent être créés publiquement.');
  }

  return errors;
}

/**
 * Demo-only marker. This is intentionally not a security primitive.
 * Replace this module's credential operations with a Django API in production.
 */
export function demoCredentialHash(phone: string, password: string): string {
  return `demo:${phone.trim()}:${password}`;
}

export async function registerPublicAccount(input: PublicRegistrationInput): Promise<User> {
  if (input.role !== 'CLIENT' && input.role !== 'COLLECTEUR') {
    throw new AuthValidationError('Création publique d’un compte ADMIN refusée.');
  }

  const validationErrors = validatePublicRegistration(input);
  if (validationErrors.length) {
    throw new AuthValidationError(validationErrors[0]);
  }

  const database = await loadDatabase();
  if (!database.settings.allowPublicRegistration) {
    throw new AuthValidationError('Les inscriptions sont temporairement fermées.');
  }
  const normalizedPhone = input.phone.trim();

  if (database.users.some((user) => user.phone === normalizedPhone)) {
    throw new AuthValidationError('Ce numéro de téléphone est déjà utilisé.');
  }

  const user: User = {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    phone: normalizedPhone,
    address: input.address.trim(),
    role: input.role,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    credentialHash: demoCredentialHash(normalizedPhone, input.password),
  };

  await saveDatabase({ ...database, users: [...database.users, user] });
  return user;
}

export async function login(credentials: LoginCredentials): Promise<User> {
  const database = await loadDatabase();
  const phone = credentials.phone.trim();
  const credentialHash = demoCredentialHash(phone, credentials.password);
  const user = database.users.find(
    (candidate) => candidate.phone === phone && candidate.credentialHash === credentialHash,
  );

  if (!user) throw new AuthValidationError('Numéro de téléphone ou mot de passe incorrect.');
  if (user.status !== 'ACTIVE') {
    throw new AuthValidationError('Ce compte est désactivé.');
  }

  await saveSessionUserId(user.id);
  return user;
}

export async function getSessionUser(): Promise<User | null> {
  const userId = await loadSessionUserId();
  if (!userId) return null;

  const database = await loadDatabase();
  const user = database.users.find((candidate) => candidate.id === userId) ?? null;
  if (!user || user.status !== 'ACTIVE') {
    await clearSession();
    return null;
  }
  return user;
}

export async function logout(): Promise<void> {
  await clearSession();
}

export async function createControlledAdmin(input: {
  creatorId: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  password: string;
}): Promise<User> {
  const database = await loadDatabase();
  const creator = database.users.find((user) => user.id === input.creatorId);

  if (!creator || creator.role !== 'ADMIN' || creator.status !== 'ACTIVE') {
    throw new AuthValidationError('Seul un administrateur autorisé peut créer un compte ADMIN.');
  }

  const phone = input.phone.trim();
  if (!input.firstName.trim() || !input.lastName.trim() || !phone || !input.address.trim()) {
    throw new AuthValidationError('Tous les champs administrateur sont obligatoires.');
  }
  if (!/^\+?[0-9]{8,15}$/.test(phone)) {
    throw new AuthValidationError('Le numéro de téléphone doit contenir 8 à 15 chiffres.');
  }
  if (database.users.some((user) => user.phone === phone)) {
    throw new AuthValidationError('Ce numéro de téléphone est déjà utilisé.');
  }

  if (!input.password || input.password.length < 8) {
    throw new AuthValidationError('Le mot de passe administrateur doit contenir au moins 8 caractères.');
  }

  const admin: User = {
    id: `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    phone,
    address: input.address.trim(),
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    credentialHash: demoCredentialHash(phone, input.password),
  };

  await saveDatabase({ ...database, users: [...database.users, admin] });
  return admin;
}

export function isPublicRole(role: User['role']): role is PublicAccountRole {
  return role === 'CLIENT' || role === 'COLLECTEUR';
}
