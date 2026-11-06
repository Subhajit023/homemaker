import Storage from 'expo-sqlite/kv-store';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { bookingMapper, itemMapper, memberMapper, thingMapper } from '@/features/family/mappers';
import { inventoryKey, loadItems, saveItems } from '@/features/inventory/storage';
import { MEMBER_COLORS } from '@/features/sharing/sample-data';
import { loadSharing, saveSharing, sharingKey } from '@/features/sharing/storage';
import { cloudFetchAll, cloudUpsert, makeId } from '@/lib/cloud-sync';
import { ensureSignedIn, isCloudConfigured, supabase } from '@/lib/supabase';
import { strings } from '@/i18n';

const STORAGE_KEY = 'family.v1';
const LOCAL_ME_KEY = 'me.v1';

export type Family = {
  householdId: string;
  name: string;
  inviteCode: string;
  /** The member profile this phone belongs to. */
  memberId: string;
};

export type InvitePreview = {
  householdId: string;
  name: string;
  members: { id: string; name: string; emoji: string; color: string; photo?: string; claimed: boolean }[];
};

type FamilyContextValue = {
  family: Family | null;
  /**
   * Which member is using this phone: your family profile when sharing, otherwise the
   * person picked on this phone (null = not chosen yet).
   */
  meId: string | null;
  setLocalMe: (memberId: string) => void;
  /** False until the Supabase keys are configured. */
  isCloudConfigured: boolean;
  /** Creates a family from this phone's current data. `meId` is which local member you are. */
  createFamily: (name: string, meId: string) => Promise<void>;
  previewInvite: (code: string) => Promise<InvitePreview | null>;
  /** Joins as an existing member (`claimMemberId`) or as a new person (`newMember`). */
  /** Joins and downloads the family's existing data. Returns how much was loaded. */
  joinFamily: (
    code: string,
    claimMemberId: string | null,
    newMember?: { name: string; emoji: string; phone: string }
  ) => Promise<JoinResult>;
  leaveFamily: () => Promise<void>;
};

export type JoinResult = { items: number; plans: number; things: number };

const FamilyContext = createContext<FamilyContextValue | null>(null);

function loadFamily(): Family | null {
  try {
    const raw = Storage.getItemSync(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Family) : null;
  } catch {
    return null;
  }
}

function friendlyError(error: { message?: string } | null | undefined, fallback: string) {
  const message = error?.message ?? '';
  const errors = strings().family.errors;
  if (/anonymous/i.test(message)) return errors.anonymousOff;
  if (/fetch|network/i.test(message)) return errors.offline;
  if (/invite code is not valid/i.test(message)) return errors.invalidCode;
  if (/already joined/i.test(message)) return errors.alreadyJoined;
  return message || fallback;
}

const errors = () => strings().family.errors;

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [family, setFamily] = useState<Family | null>(loadFamily);
  const [localMeId, setLocalMeId] = useState<string | null>(() => Storage.getItemSync(LOCAL_ME_KEY));

  function setLocalMe(memberId: string) {
    setLocalMeId(memberId);
    Storage.setItemSync(LOCAL_ME_KEY, memberId);
  }

  useEffect(() => {
    if (family) Storage.setItemSync(STORAGE_KEY, JSON.stringify(family));
    else Storage.removeItemSync(STORAGE_KEY);
  }, [family]);

  // Keep the family name / invite code fresh (someone may have renamed it).
  const householdId = family?.householdId;
  useEffect(() => {
    if (!supabase || !householdId) return;
    supabase
      .from('households')
      .select('name, invite_code')
      .eq('id', householdId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setFamily((f) => (f ? { ...f, name: data.name, inviteCode: data.invite_code } : f));
        }
      });
  }, [householdId]);

  async function createFamily(name: string, meId: string) {
    if (!supabase) throw new Error(errors().notSetUp);
    await ensureSignedIn();

    // Everything currently on this phone becomes the family's starting data.
    const items = loadItems(inventoryKey(null), () => makeId('i'));
    const sharing = loadSharing(sharingKey(null));
    const me = sharing.members.find((m) => m.id === meId);
    if (!me) throw new Error(errors().chooseYou);

    const { data, error } = await supabase.rpc('create_household', {
      p_name: name,
      p_member: memberMapper.toRow(me, ''),
    });
    if (error || !data) throw new Error(friendlyError(error, errors().create));
    const { id: hid, invite_code } = data as { id: string; invite_code: string };

    await cloudUpsert(memberMapper, hid, sharing.members.filter((m) => m.id !== me.id));
    await cloudUpsert(thingMapper, hid, sharing.things);
    await cloudUpsert(itemMapper, hid, items);
    await cloudUpsert(bookingMapper, hid, sharing.bookings);

    // Seed the family cache so the switch is instant.
    saveItems(inventoryKey(hid), items);
    saveSharing(sharingKey(hid), sharing);
    setLocalMe(me.id);
    setFamily({ householdId: hid, name, inviteCode: invite_code, memberId: me.id });
  }

  async function previewInvite(code: string) {
    if (!supabase) throw new Error(errors().notSetUp);
    await ensureSignedIn();
    const { data, error } = await supabase.rpc('preview_invite', { p_code: code });
    if (error) throw new Error(friendlyError(error, errors().check));
    if (!data) return null;
    const preview = data as {
      household_id: string;
      name: string;
      members: InvitePreview['members'];
    };
    return { householdId: preview.household_id, name: preview.name, members: preview.members };
  }

  async function joinFamily(
    code: string,
    claimMemberId: string | null,
    newMember?: { name: string; emoji: string; phone: string }
  ): Promise<JoinResult> {
    if (!supabase) throw new Error(errors().notSetUp);
    await ensureSignedIn();
    const { data, error } = await supabase.rpc('join_household', {
      p_code: code,
      p_member_id: claimMemberId,
      p_member: newMember
        ? {
            id: makeId('m'),
            name: newMember.name,
            emoji: newMember.emoji,
            phone: newMember.phone,
            color: MEMBER_COLORS[Math.floor(Math.random() * MEMBER_COLORS.length)],
          }
        : null,
    });
    if (error || !data) throw new Error(friendlyError(error, errors().join));
    const { household_id, member_id } = data as { household_id: string; member_id: string };

    const { data: household } = await supabase
      .from('households')
      .select('name, invite_code')
      .eq('id', household_id)
      .maybeSingle();

    // Download everything the family already has before switching, so the joiner
    // sees the full list straight away (live updates take over after that).
    let result: JoinResult = { items: 0, plans: 0, things: 0 };
    try {
      const [items, members, things, bookings] = await Promise.all([
        cloudFetchAll(itemMapper, household_id),
        cloudFetchAll(memberMapper, household_id),
        cloudFetchAll(thingMapper, household_id),
        cloudFetchAll(bookingMapper, household_id),
      ]);
      saveItems(inventoryKey(household_id), items);
      saveSharing(sharingKey(household_id), { members, things, bookings });
      result = { items: items.length, plans: bookings.length, things: things.length };
    } catch (e) {
      // Not fatal: the app keeps retrying in the background once joined.
      console.warn('[family] initial download failed', (e as Error).message);
    }

    setFamily({
      householdId: household_id,
      name: household?.name ?? 'Family',
      inviteCode: household?.invite_code ?? code.toUpperCase(),
      memberId: member_id,
    });
    return result;
  }

  async function leaveFamily() {
    if (supabase && family) {
      const { error } = await supabase.rpc('leave_household', { p_household: family.householdId });
      if (error) throw new Error(friendlyError(error, errors().leave));
    }
    setFamily(null);
  }

  return (
    <FamilyContext
      value={{
        family,
        meId: family?.memberId ?? localMeId,
        setLocalMe,
        isCloudConfigured,
        createFamily,
        previewInvite,
        joinFamily,
        leaveFamily,
      }}>
      {children}
    </FamilyContext>
  );
}

export function useFamily() {
  const ctx = use(FamilyContext);
  if (!ctx) throw new Error('useFamily must be used inside <FamilyProvider>');
  return ctx;
}
