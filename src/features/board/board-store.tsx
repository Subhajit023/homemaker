import Storage from 'expo-sqlite/kv-store';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { useFamily } from '@/features/family/family-store';
import type { TableMapper } from '@/lib/cloud-sync';
import { cloudDelete, cloudUpsert, makeId, upsertById, useCloudTable } from '@/lib/cloud-sync';
import { supabase } from '@/lib/supabase';

import type { Post } from './types';

/** Older posts are dropped from the phone's cache to keep it small. */
const MAX_CACHED = 200;

function boardKey(householdId: string | null) {
  return householdId ? `board.${householdId}` : 'board.v1';
}

function loadPosts(key: string): Post[] {
  try {
    const raw = Storage.getItemSync(key);
    if (raw) return JSON.parse(raw) as Post[];
  } catch (error) {
    console.warn('Failed to load board', error);
  }
  return [];
}

export const postMapper: TableMapper<Post> = {
  table: 'posts',
  toRow: (p, household_id) => ({
    household_id,
    id: p.id,
    member_id: p.memberId,
    text: p.text,
    photo: p.photo,
    hidden_from: p.hiddenFrom,
    created_at: new Date(p.createdAt).toISOString(),
  }),
  fromRow: (row) => ({
    id: row.id as string,
    memberId: row.member_id as string,
    text: (row.text as string) ?? '',
    photo: (row.photo as string) ?? '',
    reactions: (row.reactions as Record<string, string[]>) ?? {},
    hiddenFrom: (row.hidden_from as string[]) ?? [],
    createdAt: new Date(row.created_at as string).getTime(),
  }),
};

type NewPost = { memberId: string; text: string; photo: string; hiddenFrom: string[] };

type BoardContextValue = {
  /** Newest first, without posts hidden from this phone's member. */
  posts: Post[];
  addPost: (post: NewPost) => void;
  removePost: (id: string) => void;
  restorePost: (post: Post) => void;
  toggleReaction: (postId: string, emoji: string, memberId: string) => void;
};

const BoardContext = createContext<BoardContextValue | null>(null);

/** The family message board. Saved on the phone; synced live when sharing with family. */
export function BoardProvider({ children }: { children: ReactNode }) {
  const { family } = useFamily();
  const hid = family?.householdId ?? null;
  const key = boardKey(hid);

  const [loadedKey, setLoadedKey] = useState(key);
  const [posts, setPosts] = useState<Post[]>(() => loadPosts(key));

  if (loadedKey !== key) {
    setLoadedKey(key);
    setPosts(loadPosts(key));
  }

  useEffect(() => {
    if (loadedKey !== key) return;
    const newest = [...posts].sort((a, b) => b.createdAt - a.createdAt).slice(0, MAX_CACHED);
    Storage.setItemSync(key, JSON.stringify(newest));
  }, [posts, key, loadedKey]);

  useCloudTable(postMapper, hid, setPosts);

  const me = family?.memberId;
  const visible = posts
    .filter((p) => !me || !p.hiddenFrom.includes(me))
    .sort((a, b) => b.createdAt - a.createdAt);

  const value: BoardContextValue = {
    posts: visible,
    addPost: (input) => {
      const post: Post = { ...input, id: makeId('p'), reactions: {}, createdAt: Date.now() };
      setPosts((prev) => [...prev, post]);
      cloudUpsert(postMapper, hid, [post]);
    },
    removePost: (id) => {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      cloudDelete(postMapper.table, hid, [id]);
    },
    restorePost: (post) => {
      setPosts((prev) => upsertById(prev, post));
      cloudUpsert(postMapper, hid, [post]);
    },
    toggleReaction: (postId, emoji, memberId) => {
      // Optimistic local toggle…
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const who = p.reactions[emoji] ?? [];
          const next = who.includes(memberId) ? who.filter((m) => m !== memberId) : [...who, memberId];
          return { ...p, reactions: { ...p.reactions, [emoji]: next } };
        })
      );
      // …and an atomic toggle on the server (it works out who "me" is itself).
      if (supabase && hid) {
        supabase
          .rpc('toggle_reaction', { p_household: hid, p_post: postId, p_emoji: emoji })
          .then(({ error }) => {
            if (error) console.warn('[sync] reaction failed', error.message);
          });
      }
    },
  };

  return <BoardContext value={value}>{children}</BoardContext>;
}

export function useBoard() {
  const ctx = use(BoardContext);
  if (!ctx) throw new Error('useBoard must be used inside <BoardProvider>');
  return ctx;
}
