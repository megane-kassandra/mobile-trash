import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { RoleShell } from '@/components/role-navigation';
import { rolePageStyles } from '@/components/role-pages.styles';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import {
    cancelReservation,
    createCollection,
    deleteCollection,
    getAppDatabase,
    reserveCollection,
    setCollectionStatus,
    setReportStatus,
    setUserStatus,
    updateCollection,
    updateReservationStatus,
    updateUserProfile
} from '@/services/data-service';
import type { AppDatabase, ReportStatus, ReservationStatus, User, WasteCollection } from '@/types/models';

const colors = Colors.light;
const styles = rolePageStyles;

function localDateKey(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function PageTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return <View style={styles.pageTitle}><Text style={[styles.title, { color: colors.text }]}>{title}</Text><Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text></View>;
}

function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, { backgroundColor: colors.backgroundElement }, style]}>{children}</View>;
}

function Stat({ value, label, icon }: { value: number | string; label: string; icon: keyof typeof Ionicons.glyphMap }) {
  return <Card style={styles.stat}><View style={[styles.statIcon, { backgroundColor: colors.background }]}><Ionicons name={icon} size={22} color={colors.primary} /></View><Text style={[styles.statValue, { color: colors.text }]}>{value}</Text><Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text></Card>;
}

function DashboardHero({ eyebrow, title, description, icon, action, onPress }: {
  eyebrow: string; title: string; description: string; icon: keyof typeof Ionicons.glyphMap; action?: string; onPress?: () => void;
}) {
  return <View style={styles.dashboardHero}>
    <View style={styles.heroCopy}>
      <Text style={styles.heroEyebrow}>{eyebrow}</Text>
      <Text style={styles.heroTitle}>{title}</Text>
      <Text style={styles.heroDescription}>{description}</Text>
      {action && onPress ? <Pressable onPress={onPress} style={styles.heroAction}><Text style={styles.heroActionText}>{action}</Text><Ionicons name="arrow-forward" size={17} color={colors.primary} /></Pressable> : null}
    </View>
    <View style={styles.heroIcon}><Ionicons name={icon} size={34} color="#FFFFFF" /></View>
  </View>;
}

function DashboardAction({ title, detail, icon, onPress }: { title: string; detail: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.dashboardAction, { backgroundColor: colors.backgroundElement }, pressed && { opacity: 0.75 }]}>
    <View style={styles.dashboardActionIcon}><Ionicons name={icon} size={21} color={colors.primary} /></View>
    <View style={styles.dashboardActionCopy}><Text style={[styles.dashboardActionTitle, { color: colors.text }]}>{title}</Text><Text style={[styles.dashboardActionDetail, { color: colors.textSecondary }]}>{detail}</Text></View>
    <Ionicons name="chevron-forward" size={19} color={colors.textSecondary} />
  </Pressable>;
}

function ClientDashboard({ user, database, reservations, collectionCount, onCollectes, onReservations }: {
  user: User; database: AppDatabase; reservations: AppDatabase['reservations']; collectionCount: number; onCollectes: () => void; onReservations: () => void;
}) {
  const upcoming = reservations.map((reservation) => ({
    reservation,
    collection: database.collections.find((item) => item.id === reservation.collectionId),
  })).filter((item) => item.collection && item.collection.date >= localDateKey())
    .sort((a, b) => `${a.collection?.date} ${a.collection?.startTime}`.localeCompare(`${b.collection?.date} ${b.collection?.startTime}`)).slice(0, 3);
  return <>
    <DashboardHero eyebrow="ESPACE CLIENT" title={`Bonjour ${user.firstName} 👋`} description="Retrouvez vos prochains rendez-vous et réservez un créneau près de chez vous." icon="leaf-outline" action="Trouver une collecte" onPress={onCollectes} />
    <View style={styles.statsRow}><Stat value={collectionCount} label="Collectes disponibles" icon="navigate-outline" /><Stat value={reservations.length} label="Réservations actives" icon="calendar-outline" /></View>
    <Text style={[styles.sectionTitle, { color: colors.text }]}>Accès rapides</Text>
    <View style={styles.dashboardActions}>
      <DashboardAction title="Explorer les collectes" detail="Choisissez votre quartier et un créneau." icon="search-outline" onPress={onCollectes} />
      <DashboardAction title="Mes réservations" detail="Consultez les demandes en cours." icon="calendar-outline" onPress={onReservations} />
    </View>
    <Text style={[styles.sectionTitle, { color: colors.text }]}>À venir</Text>
    {upcoming.length ? upcoming.map(({ reservation, collection }) => collection ? <Card key={reservation.id} style={styles.upcomingCard}>
      <View style={styles.upcomingDate}><Text style={styles.upcomingMonth}>{collection.date.slice(5, 7)}/{collection.date.slice(8)}</Text><Ionicons name="calendar-outline" size={17} color={colors.primary} /></View>
      <View style={styles.upcomingCopy}><Text style={[styles.cardTitle, { color: colors.text }]}>{collection.location}</Text><Text style={[styles.cardText, { color: colors.textSecondary }]}>{collection.date} · {collection.startTime}–{collection.endTime}</Text></View>
      <View style={styles.pendingBadge}><Text style={styles.pendingText}>{reservation.status === 'CONFIRMEE' ? 'Confirmée' : 'En attente'}</Text></View>
    </Card> : null) : <Card style={styles.emptyDashboard}><Ionicons name="calendar-clear-outline" size={25} color={colors.primary} /><Text style={[styles.emptyDashboardTitle, { color: colors.text }]}>Rien de planifié pour le moment</Text><Text style={[styles.cardText, { color: colors.textSecondary }]}>Vos prochains rendez-vous apparaîtront ici.</Text></Card>}
  </>;
}

function CollectorDashboard({ user, collections, reservationCount, onPublish, onCollections, onReservations }: {
  user: User; collections: WasteCollection[]; reservationCount: number; onPublish: () => void; onCollections: () => void; onReservations: () => void;
}) {
  const upcoming = collections.filter((item) => item.status === 'PUBLISHED' && item.date >= localDateKey()).sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)).slice(0, 3);
  return <>
    <DashboardHero eyebrow="ESPACE COLLECTEUR" title={`Bonjour ${user.firstName}`} description="Pilotez vos tournées, suivez les places réservées et gardez votre planning à jour." icon="bicycle-outline" action="Publier une collecte" onPress={onPublish} />
    <View style={styles.statsRow}><Stat value={collections.filter((item) => item.status === 'PUBLISHED').length} label="Collectes publiées" icon="calendar-outline" /><Stat value={reservationCount} label="Réservations actives" icon="people-outline" /></View>
    <Text style={[styles.sectionTitle, { color: colors.text }]}>Votre espace de travail</Text>
    <View style={styles.dashboardActions}>
      <DashboardAction title="Gérer mes collectes" detail="Modifiez les lieux, horaires et capacités." icon="clipboard-outline" onPress={onCollections} />
      <DashboardAction title="Voir les réservations" detail="Retrouvez les clients de vos tournées." icon="people-outline" onPress={onReservations} />
    </View>
    <Text style={[styles.sectionTitle, { color: colors.text }]}>Prochaines tournées</Text>
    {upcoming.length ? upcoming.map((item) => <Card key={item.id} style={styles.upcomingCard}><View style={styles.calendarSquare}><Ionicons name="location-outline" size={21} color={colors.primary} /></View><View style={styles.upcomingCopy}><Text style={[styles.cardTitle, { color: colors.text }]}>{item.location}</Text><Text style={[styles.cardText, { color: colors.textSecondary }]}>{item.date} · {item.startTime}–{item.endTime}</Text><Text style={[styles.cardText, { color: colors.textSecondary }]}>{item.maxCapacity} places · {item.locationDetails}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.textSecondary} /></Card>) : <Card style={styles.emptyDashboard}><Ionicons name="calendar-outline" size={25} color={colors.primary} /><Text style={[styles.emptyDashboardTitle, { color: colors.text }]}>Aucune tournée à venir</Text><Pressable onPress={onPublish}><Text style={{ color: colors.primary, fontWeight: '800', marginTop: 8 }}>Publier votre première collecte</Text></Pressable></Card>}
  </>;
}

export function ClientPage({ view }: { view: 'dashboard' | 'collectes' | 'reservations' | 'historique' }) {
  const { user, refreshSession } = useAuth();
  const router = useRouter();
  const [database, setDatabase] = useState<AppDatabase | null>(null);
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const [message, setMessage] = useState('');

  const refresh = useCallback(async () => setDatabase(await getAppDatabase()), []);
  useEffect(() => { void refresh(); }, [refresh]);

  if (!user || !database) return <RoleShell><View style={styles.center}><Text style={{ color: colors.textSecondary }}>Chargement...</Text></View></RoleShell>;

  const activeReservations = database.reservations.filter((item) => item.clientId === user.id && item.status !== 'ANNULEE' && item.status !== 'TERMINEE');
  const activeCollections = database.collections.filter((item) => {
    if (item.status !== 'PUBLISHED' || item.date < localDateKey()) return false;
    if (!database.users.some((candidate) => candidate.id === item.collectorId && candidate.role === 'COLLECTEUR' && candidate.status === 'ACTIVE')) return false;
    if (search && !(`${item.location} ${item.locationDetails}`).toLowerCase().includes(search.toLowerCase())) return false;
    if (date && item.date !== date) return false;
    return true;
  });
  const cancel = async (reservationId: string) => {
    try { await cancelReservation(reservationId, user.id); setMessage('Réservation annulée.'); await refresh(); }
    catch (e) { setMessage(e instanceof Error ? e.message : 'Annulation impossible.'); }
  };
  const reserve = async (collectionId: string) => {
    try { await reserveCollection(collectionId, user.id); setMessage('Réservation enregistrée.'); await refresh(); }
    catch (e) { setMessage(e instanceof Error ? e.message : 'Réservation impossible.'); }
  };

  return (
    <RoleShell>
      <ScrollView contentContainerStyle={styles.scroll}>
        {view === 'dashboard' && <ClientDashboard user={user} database={database} reservations={activeReservations} collectionCount={activeCollections.length} onCollectes={() => router.push('/client/collectes')} onReservations={() => router.push('/client/reservations')} />}

        {view === 'collectes' && <><PageTitle title="Collectes disponibles" subtitle="Recherchez une collecte près de chez vous." /><View style={styles.filters}><TextInput value={search} onChangeText={(value) => setSearch(value.toLowerCase())} placeholder="Quartier ou lieu" placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]} /><TextInput value={date} onChangeText={setDate} placeholder="AAAA-MM-JJ" placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]} /></View>{message ? <View style={styles.notice}><Text style={styles.noticeText}>{message}</Text></View> : null}{activeCollections.map((collection) => { const collector = database.users.find((user) => user.id === collection.collectorId); const count = database.reservations.filter((item) => item.collectionId === collection.id && item.status !== 'ANNULEE' && item.status !== 'TERMINEE').length; const remaining = collection.maxCapacity - count; const alreadyReserved = database.reservations.some((item) => item.collectionId === collection.id && item.clientId === user.id && item.status !== 'ANNULEE' && item.status !== 'TERMINEE'); return <Card key={collection.id} style={styles.collectionCard}><View style={styles.cardHeader}><View><Text style={[styles.cardTitle, { color: colors.text }]}>{collection.location}</Text><Text style={[styles.cardText, { color: colors.primary }]}>{collection.date} · {collection.startTime}–{collection.endTime}</Text></View><View style={[styles.badge, { backgroundColor: colors.background }]}><Text style={{ color: colors.primary, fontWeight: '800' }}>{remaining} place(s)</Text></View></View><Text style={[styles.cardText, { color: colors.textSecondary }]}>{collection.locationDetails}</Text>{collection.description ? <Text style={[styles.cardText, { color: colors.textSecondary }]}>{collection.description}</Text> : null}<Text style={[styles.cardText, { color: colors.text }]}>Éboueur : {collector?.firstName} {collector?.lastName}</Text><Pressable disabled={remaining <= 0 || alreadyReserved} onPress={() => reserve(collection.id)} style={[styles.button, { backgroundColor: remaining <= 0 || alreadyReserved ? '#AAB6AF' : colors.primary }]}><Text style={styles.buttonText}>{alreadyReserved ? 'Déjà réservé' : remaining <= 0 ? 'Complet' : 'Réserver'}</Text></Pressable></Card>; })}{activeCollections.length === 0 ? <Card><Text style={[styles.empty, { color: colors.textSecondary }]}>Aucune collecte ne correspond à votre recherche.</Text></Card> : null}</>}

        {view === 'reservations' && <><PageTitle title="Mes réservations" subtitle="Gérez vos prochaines collectes." />{activeReservations.map((reservation) => { const collection = database.collections.find((item) => item.id === reservation.collectionId); return collection ? <Card key={reservation.id} style={styles.collectionCard}><Text style={[styles.cardTitle, { color: colors.text }]}>{collection.location}</Text><Text style={[styles.cardText, { color: colors.primary }]}>{collection.date} · {collection.startTime}–{collection.endTime}</Text><Text style={[styles.status, { color: colors.primary }]}>{reservation.status}</Text><Pressable onPress={() => cancel(reservation.id)} style={styles.textButton}><Text style={{ color: '#C0392B', fontWeight: '800' }}>Annuler</Text></Pressable></Card> : null; })}{activeReservations.length === 0 ? <Card><Text style={[styles.empty, { color: colors.textSecondary }]}>Aucune réservation à venir.</Text></Card> : null}</>}

        {view === 'historique' && <><PageTitle title="Historique" subtitle="Consultez vos réservations passées et annulées." />{database.reservations.filter((item) => item.clientId === user.id).map((reservation) => { const collection = database.collections.find((item) => item.id === reservation.collectionId); return collection ? <Card key={reservation.id} style={styles.collectionCard}><Text style={[styles.cardTitle, { color: colors.text }]}>{collection.location}</Text><Text style={[styles.cardText, { color: colors.textSecondary }]}>{collection.date} · {collection.startTime}</Text><Text style={[styles.status, { color: colors.primary }]}>{reservation.status}</Text>{reservation.status !== 'ANNULEE' && reservation.status !== 'TERMINEE' ? <Pressable onPress={() => cancel(reservation.id)} style={styles.textButton}><Text style={{ color: '#C0392B', fontWeight: '800' }}>Annuler</Text></Pressable> : null}</Card> : null; })}{database.reservations.filter((item) => item.clientId === user.id).length === 0 ? <Card><Text style={[styles.empty, { color: colors.textSecondary }]}>Vous n’avez pas encore réservé de collecte.</Text></Card> : null}</>}
      </ScrollView>
    </RoleShell>
  );
}

export function CollectorPage({ view }: { view: 'dashboard' | 'publish' | 'collections' | 'reservations' }) {
  const { user } = useAuth();
  const router = useRouter();
  const { collectionId } = useLocalSearchParams<{ collectionId?: string }>();
  const [database, setDatabase] = useState<AppDatabase | null>(null);
  const [location, setLocation] = useState('');
  const [locationDetails, setLocationDetails] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');
  const [capacity, setCapacity] = useState('5');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const refresh = useCallback(async () => setDatabase(await getAppDatabase()), []);
  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (view !== 'publish' || !collectionId || !database || !user) return;
    const collection = database.collections.find((item) => item.id === collectionId && item.collectorId === user.id);
    if (!collection) {
      setMessage('Cette collecte est introuvable ou ne vous appartient pas.');
      return;
    }
    setEditingId(collection.id);
    setLocation(collection.location);
    setLocationDetails(collection.locationDetails);
    setDate(collection.date);
    setStartTime(collection.startTime);
    setEndTime(collection.endTime);
    setCapacity(String(collection.maxCapacity));
    setDescription(collection.description ?? '');
  }, [collectionId, database, user, view]);

  if (!user || !database) return <RoleShell><View style={styles.center}><Text style={{ color: colors.textSecondary }}>Chargement...</Text></View></RoleShell>;

  const myCollections = database.collections.filter((item) => item.collectorId === user.id);
  const myReservations = database.reservations.filter((reservation) =>
    myCollections.some((collection) => collection.id === reservation.collectionId),
  );

  const resetForm = () => {
    setLocation(''); setLocationDetails(''); setDate(''); setStartTime('08:00'); setEndTime('10:00'); setCapacity('5'); setDescription(''); setEditingId(null);
  };

  const submit = async () => {
    setMessage('');
    const wasEditing = Boolean(editingId);
    try {
      if (editingId) {
        await updateCollection(editingId, user.id, { location, locationDetails, date, startTime, endTime, maxCapacity: Number(capacity), description });
        setMessage('Collecte modifiée.');
      } else {
        await createCollection({ collectorId: user.id, location, locationDetails, date, startTime, endTime, maxCapacity: Number(capacity), description });
        setMessage('Collecte publiée.');
      }
      resetForm(); await refresh();
      if (wasEditing) router.replace('/collector/collections');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Opération impossible.'); }
  };

  const removeCollection = async (collection: WasteCollection) => {
    try { await deleteCollection(collection.id, user.id); setMessage('Collecte supprimée.'); await refresh(); }
    catch (e) { setMessage(e instanceof Error ? e.message : 'Suppression impossible.'); }
  };

  return (
    <RoleShell>
      <ScrollView contentContainerStyle={styles.scroll}>
        {view === 'dashboard' && <CollectorDashboard user={user} collections={myCollections} reservationCount={myReservations.filter((item) => item.status !== 'ANNULEE' && item.status !== 'TERMINEE').length} onPublish={() => router.push('/collector/publish')} onCollections={() => router.push('/collector/collections')} onReservations={() => router.push('/collector/reservations')} />}

        {view === 'publish' && <><PageTitle title={editingId ? 'Modifier une collecte' : 'Publier une collecte'} subtitle="Renseignez le lieu, les horaires et la capacité." /><Card><Text style={[styles.label, { color: colors.text }]}>Lieu ou quartier</Text><TextInput value={location} onChangeText={setLocation} style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]} /><Text style={[styles.label, { color: colors.text }]}>Indications complémentaires</Text><TextInput value={locationDetails} onChangeText={setLocationDetails} style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]} /><View style={styles.formRow}><View style={styles.formField}><Text style={[styles.label, { color: colors.text }]}>Date</Text><TextInput value={date} onChangeText={setDate} placeholder="AAAA-MM-JJ" placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]} /></View><View style={styles.formField}><Text style={[styles.label, { color: colors.text }]}>Capacité</Text><TextInput value={capacity} onChangeText={setCapacity} keyboardType="numeric" style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]} /></View></View><View style={styles.formRow}><View style={styles.formField}><Text style={[styles.label, { color: colors.text }]}>Heure de début</Text><TextInput value={startTime} onChangeText={setStartTime} placeholder="08:00" placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]} /></View><View style={styles.formField}><Text style={[styles.label, { color: colors.text }]}>Heure de fin</Text><TextInput value={endTime} onChangeText={setEndTime} placeholder="10:00" placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]} /></View></View><Text style={[styles.label, { color: colors.text }]}>Description</Text><TextInput value={description} onChangeText={setDescription} style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]} /><View style={styles.buttonRow}><Pressable onPress={resetForm} style={[styles.button, { backgroundColor: colors.background }]}><Text style={{ color: colors.primary, fontWeight: '800' }}>Annuler</Text></Pressable><Pressable onPress={submit} style={[styles.button, { backgroundColor: colors.primary }]}><Text style={styles.buttonText}>{editingId ? 'Modifier' : 'Publier'}</Text></Pressable></View></Card></>}

        {view === 'collections' && <><PageTitle title="Mes collectes" subtitle="Modifiez ou retirez vos publications." />{myCollections.map((collection) => { const count = myReservations.filter((item) => item.collectionId === collection.id && item.status !== 'ANNULEE' && item.status !== 'TERMINEE').length; return <Card key={collection.id} style={styles.collectionCard}><View style={styles.cardHeader}><View style={{ flex: 1 }}><Text style={[styles.cardTitle, { color: colors.text }]}>{collection.location}</Text><Text style={[styles.cardText, { color: colors.primary }]}>{collection.date} · {collection.startTime}–{collection.endTime}</Text></View><Text style={[styles.badgeText, { color: colors.primary }]}>{count}/{collection.maxCapacity}</Text></View><Text style={[styles.cardText, { color: colors.textSecondary }]}>{collection.locationDetails}</Text><View style={styles.actionsRow}><Pressable onPress={() => router.push({ pathname: '/collector/publish', params: { collectionId: collection.id } })} style={[styles.smallButton, { backgroundColor: colors.background }]}><Text style={{ color: colors.primary, fontWeight: '800' }}>Modifier</Text></Pressable><Pressable onPress={() => removeCollection(collection)} style={[styles.smallButton, { backgroundColor: '#FCE8E8' }]}><Text style={{ color: '#C0392B', fontWeight: '800' }}>Supprimer</Text></Pressable></View></Card>; })}{myCollections.length === 0 ? <Card><Text style={[styles.empty, { color: colors.textSecondary }]}>Aucune collecte publiée.</Text></Card> : null}</>}

        {view === 'reservations' && <><PageTitle title="Réservations reçues" subtitle="Identifiez les clients ayant réservé vos collectes." />{myCollections.map((collection) => { const reservations = myReservations.filter((item) => item.collectionId === collection.id && item.status !== 'ANNULEE' && item.status !== 'TERMINEE'); return <Card key={collection.id} style={styles.collectionCard}><Text style={[styles.cardTitle, { color: colors.text }]}>{collection.location}</Text><Text style={[styles.cardText, { color: colors.primary }]}>{reservations.length}/{collection.maxCapacity} réservation(s)</Text>{reservations.map((reservation) => { const client = database.users.find((item) => item.id === reservation.clientId); return <View key={reservation.id} style={styles.clientRow}><View><Text style={[styles.cardText, { color: colors.text, fontWeight: '800' }]}>{client?.firstName} {client?.lastName}</Text><Text style={[styles.cardText, { color: colors.textSecondary }]}>{client?.phone}</Text></View><Text style={[styles.status, { color: colors.primary }]}>{reservation.status}</Text></View>; })}{reservations.length === 0 ? <Text style={[styles.cardText, { color: colors.textSecondary }]}>Aucun client pour le moment.</Text> : null}</Card>; })}</>}
      </ScrollView>
    </RoleShell>
  );
}

export function AdminPage({ view }: { view: 'dashboard' | 'users' | 'collections' | 'reservations' | 'reports' }) {
  const { user } = useAuth();
  const [database, setDatabase] = useState<AppDatabase | null>(null);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const refresh = useCallback(async () => setDatabase(await getAppDatabase()), []);
  useEffect(() => { void refresh(); }, [refresh]);
  if (!user || !database) return <RoleShell><View style={styles.center}><Text style={{ color: colors.textSecondary }}>Chargement...</Text></View></RoleShell>;

  const users = database.users.filter((item) => !search || `${item.firstName} ${item.lastName} ${item.phone} ${item.address}`.toLowerCase().includes(search.toLowerCase()));
  const toggleUser = async (target: User) => { try { await setUserStatus(user.id, target.id, target.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'); setMessage('Statut du compte mis à jour.'); await refresh(); } catch (e) { setMessage(e instanceof Error ? e.message : 'Modification impossible.'); } };
  const disableCollection = async (collection: WasteCollection) => { try { await setCollectionStatus(user.id, collection.id, collection.status === 'DISABLED' ? 'PUBLISHED' : 'DISABLED'); setMessage('Statut de la collecte mis à jour.'); await refresh(); } catch (e) { setMessage(e instanceof Error ? e.message : 'Modification impossible.'); } };
  const changeReservation = async (reservationId: string, status: ReservationStatus) => { try { await updateReservationStatus(reservationId, status, user.id); setMessage('Statut mis à jour.'); await refresh(); } catch (e) { setMessage(e instanceof Error ? e.message : 'Modification impossible.'); } };
  const changeReport = async (reportId: string, status: ReportStatus) => { try { await setReportStatus(user.id, reportId, status); setMessage('Signalement mis à jour.'); await refresh(); } catch (e) { setMessage(e instanceof Error ? e.message : 'Modification impossible.'); } };

  const stats = { clients: database.users.filter((item) => item.role === 'CLIENT').length, collectors: database.users.filter((item) => item.role === 'COLLECTEUR').length, collections: database.collections.length, reservations: database.reservations.length, completed: database.collections.filter((item) => item.status === 'COMPLETED').length, pending: database.reservations.filter((item) => item.status === 'EN_ATTENTE').length };

  return <RoleShell><ScrollView contentContainerStyle={styles.scroll}>
    {view === 'dashboard' && <><PageTitle title="Vue générale" subtitle="Supervisez l’activité de la plateforme." /><View style={styles.statsGrid}><Stat value={stats.clients} label="Clients" icon="person-outline" /><Stat value={stats.collectors} label="Éboueurs" icon="people-outline" /><Stat value={stats.collections} label="Collectes" icon="calendar-outline" /><Stat value={stats.reservations} label="Réservations" icon="list-outline" /><Stat value={stats.completed} label="Terminées" icon="checkmark-done-outline" /><Stat value={stats.pending} label="En attente" icon="hourglass-outline" /></View><Card><Text style={[styles.cardTitle, { color: colors.text }]}>{`Répartition des réservations`}</Text><View style={styles.barRow}><Text style={[styles.cardText, { color: colors.textSecondary }]}>En attente</Text><View style={[styles.barTrack, { backgroundColor: colors.background }]}><View style={[styles.barFill, { width: `${Math.min(100, stats.pending * 20)}%`, backgroundColor: '#E9A23B' }]} /></View></View><View style={styles.barRow}><Text style={[styles.cardText, { color: colors.textSecondary }]}>Total</Text><View style={[styles.barTrack, { backgroundColor: colors.background }]}><View style={[styles.barFill, { width: `${Math.min(100, stats.reservations * 10)}%`, backgroundColor: colors.primary }]} /></View></View></Card></>}

    {view === 'users' && <><PageTitle title="Utilisateurs" subtitle="Clients et éboueurs inscrits." /><TextInput value={search} onChangeText={setSearch} placeholder="Rechercher un utilisateur" placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]} />{message ? <View style={styles.notice}><Text style={styles.noticeText}>{message}</Text></View> : null}{users.filter((item) => item.role !== 'ADMIN').map((item) => <Card key={item.id} style={styles.collectionCard}><View style={styles.cardHeader}><View style={{ flex: 1 }}><Text style={[styles.cardTitle, { color: colors.text }]}>{item.firstName} {item.lastName}</Text><Text style={[styles.cardText, { color: colors.primary }]}>{item.role === 'COLLECTEUR' ? 'Éboueur' : 'Client'}</Text></View><Text style={[styles.status, { color: item.status === 'ACTIVE' ? colors.primary : '#C0392B' }]}>{item.status}</Text></View><Text style={[styles.cardText, { color: colors.textSecondary }]}>{item.phone} · {item.address}</Text><Pressable onPress={() => toggleUser(item)} style={[styles.smallButton, { backgroundColor: item.status === 'ACTIVE' ? '#FCE8E8' : colors.background }]}><Text style={{ color: item.status === 'ACTIVE' ? '#C0392B' : colors.primary, fontWeight: '800' }}>{item.status === 'ACTIVE' ? 'Désactiver' : 'Activer'}</Text></Pressable></Card>)}</>}

    {view === 'collections' && <><PageTitle title="Collectes" subtitle="Consultez ou désactivez les publications." /><TextInput value={search} onChangeText={setSearch} placeholder="Lieu, date ou éboueur" placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]} />{database.collections.filter((item) => !search || `${item.location} ${item.date} ${database.users.find((user) => user.id === item.collectorId)?.firstName ?? ''}`.toLowerCase().includes(search.toLowerCase())).map((collection) => { const collector = database.users.find((item) => item.id === collection.collectorId); const count = database.reservations.filter((item) => item.collectionId === collection.id && item.status !== 'ANNULEE' && item.status !== 'TERMINEE').length; return <Card key={collection.id} style={styles.collectionCard}><View style={styles.cardHeader}><View style={{ flex: 1 }}><Text style={[styles.cardTitle, { color: colors.text }]}>{collection.location}</Text><Text style={[styles.cardText, { color: colors.primary }]}>{collection.date} · {collection.startTime}–{collection.endTime}</Text></View><Text style={[styles.status, { color: colors.primary }]}>{count}/{collection.maxCapacity}</Text></View><Text style={[styles.cardText, { color: colors.textSecondary }]}>Éboueur : {collector?.firstName} {collector?.lastName}</Text><Text style={[styles.cardText, { color: colors.textSecondary }]}>Statut : {collection.status}</Text><Pressable onPress={() => disableCollection(collection)} style={[styles.smallButton, { backgroundColor: collection.status === 'DISABLED' ? colors.background : '#FCE8E8' }]}><Text style={{ color: collection.status === 'DISABLED' ? colors.primary : '#C0392B', fontWeight: '800' }}>{collection.status === 'DISABLED' ? 'Réactiver' : 'Désactiver'}</Text></Pressable></Card>; })}</>}

    {view === 'reservations' && <><PageTitle title="Réservations" subtitle="Consultez toutes les réservations." />{database.reservations.map((reservation) => { const client = database.users.find((item) => item.id === reservation.clientId); const collection = database.collections.find((item) => item.id === reservation.collectionId); const collector = collection ? database.users.find((item) => item.id === collection.collectorId) : undefined; return <Card key={reservation.id} style={styles.collectionCard}><Text style={[styles.cardTitle, { color: colors.text }]}>{collection?.location ?? 'Collecte inconnue'}</Text><Text style={[styles.cardText, { color: colors.textSecondary }]}>Client : {client?.firstName} {client?.lastName}</Text><Text style={[styles.cardText, { color: colors.textSecondary }]}>Éboueur : {collector?.firstName} {collector?.lastName}</Text><Text style={[styles.cardText, { color: colors.primary }]}>{collection?.date} · {collection?.startTime}</Text><View style={styles.actionsRow}>{(['EN_ATTENTE', 'CONFIRMEE', 'ANNULEE', 'TERMINEE'] as ReservationStatus[]).map((status) => <Pressable key={status} onPress={() => changeReservation(reservation.id, status)} style={[styles.statusButton, reservation.status === status && { backgroundColor: colors.backgroundSelected }]}><Text style={{ color: reservation.status === status ? colors.primary : colors.textSecondary, fontSize: 10, fontWeight: '800' }}>{status}</Text></Pressable>)}</View></Card>; })}{database.reservations.length === 0 ? <Card><Text style={[styles.empty, { color: colors.textSecondary }]}>Aucune réservation.</Text></Card> : null}</>}

    {view === 'reports' && <><PageTitle title="Signalements" subtitle="Suivez les problèmes rencontrés." />{database.reports.map((report) => { const reporter = database.users.find((item) => item.id === report.reporterId); return <Card key={report.id} style={styles.collectionCard}><View style={styles.cardHeader}><Text style={[styles.cardTitle, { color: colors.text }]}>{report.category}</Text><Text style={[styles.status, { color: colors.primary }]}>{report.status}</Text></View><Text style={[styles.cardText, { color: colors.textSecondary }]}>Par : {reporter?.firstName} {reporter?.lastName}</Text><Text style={[styles.cardText, { color: colors.text }]}>{report.message}</Text><View style={styles.actionsRow}>{(['NOUVEAU', 'EN_COURS', 'RESOLU'] as ReportStatus[]).map((status) => <Pressable key={status} onPress={() => changeReport(report.id, status)} style={[styles.statusButton, report.status === status && { backgroundColor: colors.backgroundSelected }]}><Text style={{ color: report.status === status ? colors.primary : colors.textSecondary, fontSize: 10, fontWeight: '800' }}>{status}</Text></Pressable>)}</View></Card>; })}{database.reports.length === 0 ? <Card><Text style={[styles.empty, { color: colors.textSecondary }]}>Aucun signalement.</Text></Card> : null}</>}
  </ScrollView></RoleShell>;
}

export function ProfilePage() {
  const { user, refreshSession, logout } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState(user?.address ?? '');
  const [message, setMessage] = useState('');

  if (!user) return <RoleShell><View style={styles.center}><Text>Chargement...</Text></View></RoleShell>;

  const save = async () => {
    try { await updateUserProfile(user.id, { firstName, lastName, phone, address }); await refreshSession(); setMessage('Profil mis à jour.'); } catch (e) { setMessage(e instanceof Error ? e.message : 'Modification impossible.'); }
  };
  const signOut = async () => { await logout(); router.replace('/'); };

  return <RoleShell><ScrollView contentContainerStyle={styles.scroll}><PageTitle title="Mon profil" subtitle="Gérez vos informations personnelles." /><Card><Text style={[styles.label, { color: colors.text }]}>Prénom</Text><TextInput value={firstName} onChangeText={setFirstName} style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]} /><Text style={[styles.label, { color: colors.text }]}>Nom</Text><TextInput value={lastName} onChangeText={setLastName} style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]} /><Text style={[styles.label, { color: colors.text }]}>Téléphone</Text><TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]} /><Text style={[styles.label, { color: colors.text }]}>Adresse</Text><TextInput value={address} onChangeText={setAddress} style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]} />{message ? <View style={styles.notice}><Text style={styles.noticeText}>{message}</Text></View> : null}<Pressable onPress={save} style={[styles.button, { backgroundColor: colors.primary }]}><Text style={styles.buttonText}>Enregistrer</Text></Pressable><Pressable onPress={signOut} style={[styles.button, { backgroundColor: '#FCE8E8' }]}><Text style={{ color: '#C0392B', fontWeight: '800' }}>Se déconnecter</Text></Pressable></Card></ScrollView></RoleShell>;
}
