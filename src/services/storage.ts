import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEMO_DATABASE } from '@/services/demo-data';
import type { AppDatabase } from '@/types/models';

export const DATABASE_STORAGE_KEY = '@collecte_plus/database:v1';
export const SESSION_STORAGE_KEY = '@collecte_plus/session:v1';

function isAppDatabase(value: unknown): value is AppDatabase {
  if (!value || typeof value !== 'object') return false;
  const database = value as Partial<AppDatabase>;
  return database.version === 1
    && Array.isArray(database.users)
    && Array.isArray(database.collections)
    && Array.isArray(database.reservations)
    && Array.isArray(database.reports)
    && !!database.settings
    && typeof database.settings.appName === 'string'
    && typeof database.settings.supportEmail === 'string'
    && typeof database.settings.allowPublicRegistration === 'boolean';
}

async function restoreDemoDatabase(): Promise<AppDatabase> {
  const initialDatabase = JSON.parse(JSON.stringify(DEMO_DATABASE)) as AppDatabase;
  await AsyncStorage.setItem(DATABASE_STORAGE_KEY, JSON.stringify(initialDatabase));
  return initialDatabase;
}

export async function loadDatabase(): Promise<AppDatabase> {
  const serialized = await AsyncStorage.getItem(DATABASE_STORAGE_KEY);

  if (!serialized) {
    return restoreDemoDatabase();
  }

  try {
    const database: unknown = JSON.parse(serialized);
    return isAppDatabase(database) ? database : restoreDemoDatabase();
  } catch {
    return restoreDemoDatabase();
  }
}

export async function saveDatabase(database: AppDatabase): Promise<void> {
  await AsyncStorage.setItem(DATABASE_STORAGE_KEY, JSON.stringify(database));
}

export async function resetDatabase(): Promise<AppDatabase> {
  const initialDatabase = JSON.parse(JSON.stringify(DEMO_DATABASE)) as AppDatabase;
  await saveDatabase(initialDatabase);
  return initialDatabase;
}

export async function loadSessionUserId(): Promise<string | null> {
  return AsyncStorage.getItem(SESSION_STORAGE_KEY);
}

export async function saveSessionUserId(userId: string): Promise<void> {
  await AsyncStorage.setItem(SESSION_STORAGE_KEY, userId);
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
}
