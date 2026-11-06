import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';

import { MemberAvatar } from '@/components/sharing/member-avatar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useToast } from '@/components/toast';
import { PressScale } from '@/components/ui/press-scale';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useFamily, type InvitePreview } from '@/features/family/family-store';
import { MEMBER_EMOJIS } from '@/features/sharing/sample-data';
import { useSharing } from '@/features/sharing/sharing-store';
import type { Member } from '@/features/sharing/types';
import { useTheme } from '@/hooks/use-theme';
import { contact, hasPhone } from '@/lib/contact';
import { pressFeedback, successFeedback, tapFeedback, warningFeedback } from '@/lib/haptics';
import { useT } from '@/i18n';

const BLUE = '#208AEF';
const GREEN = '#30A46C';
const RED = '#E5484D';
const WHATSAPP = '#25D366';

export default function FamilyScreen() {
  const t = useT();
  const { family, isCloudConfigured } = useFamily();
  const params = useLocalSearchParams<{ code?: string }>();

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen options={{ title: t.family.title }} />
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          {!isCloudConfigured ? (
            <NotConfigured />
          ) : family ? (
            <InFamily />
          ) : (
            <NotInFamily initialCode={params.code ?? ''} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

// ─── Not set up ────────────────────────────────────────────────

function NotConfigured() {
  const theme = useTheme();
  const t = useT();
  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText style={styles.bigEmoji}>🔌</ThemedText>
      <ThemedText style={styles.cardTitle}>{t.family.notSetUpTitle}</ThemedText>
      <ThemedText themeColor="textSecondary">
        {t.family.notSetUpText}
      </ThemedText>
    </View>
  );
}

// ─── Not in a family: create or join ──────────────────────────

function NotInFamily({ initialCode }: { initialCode: string }) {
  const t = useT();
  return (
    <>
      <View style={styles.hero}>
        <ThemedText style={styles.heroEmoji}>👨‍👩‍👧‍👦</ThemedText>
        <ThemedText style={styles.heroTitle}>{t.family.heroTitle}</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.center}>
          {t.family.heroText}
        </ThemedText>
      </View>
      <JoinCard initialCode={initialCode} />
      <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
        {t.family.or}
      </ThemedText>
      <CreateCard />
    </>
  );
}

function CreateCard() {
  const theme = useTheme();
  const t = useT();
  const toast = useToast();
  const { createFamily } = useFamily();
  const { members } = useSharing();
  const [name, setName] = useState(t.family.defaultName);
  const [meId, setMeId] = useState(members[0]?.id ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    if (!name.trim()) return setError(t.family.errName);
    if (!meId) return setError(t.family.errWho);
    pressFeedback();
    setBusy(true);
    setError(null);
    try {
      await createFamily(name.trim(), meId);
      successFeedback();
      toast({ message: t.family.created });
    } catch (e) {
      warningFeedback();
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText style={styles.cardTitle}>{t.family.startTitle}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {t.family.startText}
      </ThemedText>

      <Label>{t.family.familyName}</Label>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder={t.family.familyNamePlaceholder}
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
      />

      <Label>{t.family.whichIsYou}</Label>
      <MemberPicker
        members={members.map((m) => ({ ...m, claimed: false }))}
        selectedId={meId}
        onSelect={setMeId}
      />

      {error && <ErrorText>{error}</ErrorText>}
      <BigButton label={t.family.create} color={BLUE} busy={busy} onPress={create} />
    </View>
  );
}

function JoinCard({ initialCode }: { initialCode: string }) {
  const theme = useTheme();
  const t = useT();
  const toast = useToast();
  const { previewInvite, joinFamily } = useFamily();
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [claimId, setClaimId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState(MEMBER_EMOJIS[1]);
  const [newPhone, setNewPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function check() {
    const clean = code.replace(/\s/g, '').toUpperCase();
    if (clean.length < 6) return setError(t.family.errCode);
    pressFeedback();
    setBusy(true);
    setError(null);
    try {
      const found = await previewInvite(clean);
      if (!found) {
        warningFeedback();
        setError(t.family.codeNotFound);
      } else {
        tapFeedback();
        setPreview(found);
        setClaimId(found.members.find((m) => !m.claimed)?.id ?? null);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function join() {
    if (!claimId && !newName.trim()) return setError(t.family.errJoinWho);
    pressFeedback();
    setBusy(true);
    setError(null);
    try {
      const loaded = await joinFamily(
        code.replace(/\s/g, ''),
        claimId,
        claimId ? undefined : { name: newName.trim(), emoji: newEmoji, phone: newPhone.trim() }
      );
      successFeedback();
      toast({
        message: t.family.welcome(
          preview?.name ?? t.family.theFamily,
          loaded.items,
          loaded.things,
          loaded.plans
        ),
      });
      router.back();
    } catch (e) {
      warningFeedback();
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Animated.View
      layout={LinearTransition.springify().damping(18)}
      style={[styles.card, styles.joinCard, { backgroundColor: `${GREEN}14`, borderColor: GREEN }]}>
      <ThemedText style={styles.cardTitle}>{t.family.inviteTitle}</ThemedText>

      {!preview ? (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            {t.family.inviteText}
          </ThemedText>
          <TextInput
            value={code}
            onChangeText={(v) => {
              setCode(v.toUpperCase());
              setError(null);
            }}
            placeholder="ABCD2345"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={12}
            style={[
              styles.input,
              styles.codeInput,
              { color: theme.text, backgroundColor: theme.background },
            ]}
          />
          {error && <ErrorText>{error}</ErrorText>}
          <BigButton label={t.family.continue} color={GREEN} busy={busy} onPress={check} />
        </>
      ) : (
        <Animated.View entering={FadeInDown.springify().damping(18)} style={styles.gap}>
          <ThemedText style={styles.bold}>{t.family.joinWho(preview.name)}</ThemedText>
          <MemberPicker
            members={preview.members}
            selectedId={claimId}
            onSelect={(id) => {
              setClaimId(id);
              setError(null);
            }}
            onNew={() => {
              setClaimId(null);
              setError(null);
            }}
          />

          {claimId === null && (
            <Animated.View entering={FadeIn} style={styles.gap}>
              <Label>{t.family.yourName}</Label>
              <View style={styles.emojiRow}>
                {MEMBER_EMOJIS.slice(0, 8).map((emoji) => (
                  <PressScale
                    key={emoji}
                    scaleTo={0.8}
                    onPress={() => {
                      tapFeedback();
                      setNewEmoji(emoji);
                    }}
                    style={[
                      styles.emojiCell,
                      emoji === newEmoji && { backgroundColor: theme.backgroundSelected },
                    ]}>
                    <ThemedText style={styles.emoji}>{emoji}</ThemedText>
                  </PressScale>
                ))}
              </View>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder={t.family.yourNamePlaceholder}
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
              />
              <TextInput
                value={newPhone}
                onChangeText={setNewPhone}
                placeholder={t.manage.phonePlaceholder}
                placeholderTextColor={theme.textSecondary}
                keyboardType="phone-pad"
                style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
              />
            </Animated.View>
          )}

          <ThemedText type="small" themeColor="textSecondary">
            ℹ️ {t.family.joinInfo}
          </ThemedText>
          {error && <ErrorText>{error}</ErrorText>}
          <BigButton label={t.family.join(preview.name)} color={GREEN} busy={busy} onPress={join} />
          {busy && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
              {t.family.joining}
            </ThemedText>
          )}
          <PressScale onPress={() => setPreview(null)} style={styles.linkButton}>
            <ThemedText type="small" themeColor="textSecondary">
              {t.family.differentCode}
            </ThemedText>
          </PressScale>
        </Animated.View>
      )}
    </Animated.View>
  );
}

// ─── In a family: invite & members ────────────────────────────

function InFamily() {
  const theme = useTheme();
  const t = useT();
  const toast = useToast();
  const { family, leaveFamily } = useFamily();
  const { members } = useSharing();
  if (!family) return null;
  const { name, inviteCode, memberId } = family;
  const joined = members.filter((m) => m.userId);
  const waiting = members.filter((m) => !m.userId);

  async function shareInvite(via: 'whatsapp' | 'other', to?: Member) {
    pressFeedback();
    const message = t.family.inviteMessage(name, inviteCode, to?.name);
    if (via === 'whatsapp') {
      const ok = await contact('whatsapp', to?.phone ?? '', message);
      if (!ok) toast({ message: t.contact.noWhatsApp });
    } else {
      Share.share({ message }).catch(() => {});
    }
  }

  function confirmLeave() {
    warningFeedback();
    Alert.alert(
      t.family.leaveTitle,
      t.family.leaveText,
      [
        { text: t.family.stay, style: 'cancel' },
        {
          text: t.family.leaveButton,
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveFamily();
              toast({ message: t.family.left });
            } catch (e) {
              toast({ message: (e as Error).message });
            }
          },
        },
      ]
    );
  }

  return (
    <>
      <Animated.View entering={FadeInDown.springify().damping(18)} style={styles.familyHero}>
        <ThemedText style={styles.heroEmoji}>🏡</ThemedText>
        <ThemedText style={styles.familyName}>{name}</ThemedText>
        <View style={styles.liveRow}>
          <View style={styles.liveDot} />
          <ThemedText type="small" style={styles.liveText}>
            {t.family.live(joined.length)}
          </ThemedText>
        </View>
      </Animated.View>

      <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText style={styles.cardTitle}>{t.family.inviteFamily}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t.family.inviteHow}
        </ThemedText>
        <View style={[styles.codeBox, { backgroundColor: theme.background }]}>
          <ThemedText style={styles.code} selectable>
            {inviteCode.slice(0, 4)} {inviteCode.slice(4)}
          </ThemedText>
        </View>
        <View style={styles.buttonRow}>
          <PressScale
            onPress={() => shareInvite('whatsapp')}
            style={[styles.halfButton, { backgroundColor: WHATSAPP }]}>
            <ThemedText style={styles.white}>{t.contact.whatsapp}</ThemedText>
          </PressScale>
          <PressScale
            onPress={() => shareInvite('other')}
            style={[styles.halfButton, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText style={styles.bold}>{t.family.otherApps}</ThemedText>
          </PressScale>
        </View>
      </View>

      <View style={styles.gap}>
        <ThemedText style={styles.sectionTitle}>{t.family.onApp}</ThemedText>
        {joined.map((m) => (
          <MemberRow key={m.id} member={m}>
            <ThemedText type="small" style={styles.joinedText}>
              {m.id === memberId ? t.family.thisPhone : t.family.joinedBadge}
            </ThemedText>
          </MemberRow>
        ))}
      </View>

      {waiting.length > 0 && (
        <View style={styles.gap}>
          <ThemedText style={styles.sectionTitle}>{t.family.notJoined}</ThemedText>
          {waiting.map((m) => (
            <MemberRow key={m.id} member={m}>
              <PressScale
                scaleTo={0.92}
                onPress={() => shareInvite(hasPhone(m.phone) ? 'whatsapp' : 'other', m)}
                style={[styles.smallButton, { backgroundColor: `${WHATSAPP}22` }]}>
                <ThemedText type="smallBold" style={{ color: hasPhone(m.phone) ? WHATSAPP : theme.text }}>
                  {hasPhone(m.phone) ? `🟢 ${t.family.invite}` : `📤 ${t.family.invite}`}
                </ThemedText>
              </PressScale>
            </MemberRow>
          ))}
          <ThemedText type="small" themeColor="textSecondary">
            {t.family.pickOwnName}
          </ThemedText>
        </View>
      )}

      <PressScale onPress={confirmLeave} style={styles.linkButton}>
        <ThemedText style={{ color: RED, fontWeight: 600 }}>{t.family.leave}</ThemedText>
      </PressScale>
    </>
  );
}

// ─── Small pieces ─────────────────────────────────────────────

function MemberRow({ member, children }: { member: Member; children: ReactNode }) {
  const theme = useTheme();
  return (
    <Animated.View
      entering={FadeIn}
      layout={LinearTransition}
      style={[styles.memberRow, { backgroundColor: theme.backgroundElement }]}>
      <MemberAvatar member={member} size={40} />
      <ThemedText style={[styles.flex, styles.bold]}>{member.name}</ThemedText>
      {children}
    </Animated.View>
  );
}

function MemberPicker({
  members,
  selectedId,
  onSelect,
  onNew,
}: {
  members: { id: string; name: string; emoji: string; color: string; photo?: string; claimed: boolean }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew?: () => void;
}) {
  const theme = useTheme();
  const t = useT();
  return (
    <View style={styles.pickerRow}>
      {members.map((m) => {
        const selected = m.id === selectedId;
        return (
          <PressScale
            key={m.id}
            scaleTo={0.9}
            disabled={m.claimed}
            onPress={() => {
              tapFeedback();
              onSelect(m.id);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled: m.claimed }}
            style={[
              styles.pickerChip,
              {
                borderColor: selected ? m.color : 'transparent',
                backgroundColor: selected ? `${m.color}1A` : theme.background,
              },
              m.claimed && styles.disabled,
            ]}>
            <MemberAvatar member={m} size={40} />
            <ThemedText type="small" numberOfLines={1}>
              {m.name}
            </ThemedText>
            {m.claimed && (
              <ThemedText type="small" themeColor="textSecondary">
                {t.family.joined}
              </ThemedText>
            )}
          </PressScale>
        );
      })}
      {onNew && (
        <PressScale
          scaleTo={0.9}
          onPress={() => {
            tapFeedback();
            onNew();
          }}
          style={[
            styles.pickerChip,
            {
              borderColor: selectedId === null ? BLUE : 'transparent',
              backgroundColor: selectedId === null ? `${BLUE}1A` : theme.background,
            },
          ]}>
          <View style={[styles.newAvatar, { borderColor: theme.textSecondary }]}>
            <ThemedText themeColor="textSecondary">＋</ThemedText>
          </View>
          <ThemedText type="small">{t.family.someoneNew}</ThemedText>
        </PressScale>
      )}
    </View>
  );
}

function BigButton({
  label,
  color,
  busy,
  onPress,
}: {
  label: string;
  color: string;
  busy: boolean;
  onPress: () => void;
}) {
  return (
    <PressScale
      disabled={busy}
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.bigButton, { backgroundColor: color }, busy && styles.disabled]}>
      {busy ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <ThemedText style={styles.bigButtonText}>{label}</ThemedText>
      )}
    </PressScale>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <ThemedText type="smallBold">{children}</ThemedText>;
}

function ErrorText({ children }: { children: ReactNode }) {
  return (
    <Animated.View entering={FadeIn}>
      <ThemedText type="small" style={{ color: RED }}>
        ⚠️ {children}
      </ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
  },
  bold: {
    fontWeight: 700,
  },
  white: {
    color: '#ffffff',
    fontWeight: 700,
  },
  gap: {
    gap: Spacing.two + Spacing.one,
  },
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  heroEmoji: {
    fontSize: 56,
    lineHeight: 66,
  },
  heroTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: 700,
  },
  bigEmoji: {
    fontSize: 40,
    lineHeight: 48,
  },
  card: {
    borderRadius: 22,
    padding: Spacing.three + Spacing.one,
    gap: Spacing.two + Spacing.one,
  },
  joinCard: {
    borderWidth: 1.5,
  },
  cardTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: 700,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: 700,
  },
  input: {
    fontSize: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: 14,
  },
  codeInput: {
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: 4,
    textAlign: 'center',
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  pickerChip: {
    alignItems: 'center',
    width: 88,
    paddingVertical: Spacing.two + Spacing.one,
    borderRadius: 16,
    borderWidth: 2,
    gap: Spacing.one,
  },
  newAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  emojiCell: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
    lineHeight: 30,
  },
  bigButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    borderRadius: 16,
    marginTop: Spacing.one,
  },
  bigButtonText: {
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 17,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
  disabled: {
    opacity: 0.45,
  },
  familyHero: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  familyName: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: 800,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GREEN,
  },
  liveText: {
    color: GREEN,
    fontWeight: 700,
  },
  codeBox: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: 16,
  },
  code: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: 800,
    letterSpacing: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  halfButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: 14,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 18,
  },
  joinedText: {
    color: GREEN,
    fontWeight: 700,
  },
  smallButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.four,
  },
});
