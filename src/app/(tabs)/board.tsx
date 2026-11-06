import { Image } from 'expo-image';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';

import { PostCard } from '@/components/board/post-card';
import { TemplatePicker } from '@/components/board/template-picker';
import { FamilyButton } from '@/components/family/family-button';
import { SurprisePicker } from '@/components/family/surprise';
import { TabScreen } from '@/components/inventory/tab-screen';
import { MemberAvatar } from '@/components/sharing/member-avatar';
import { ThemedText } from '@/components/themed-text';
import { useToast } from '@/components/toast';
import { PressScale } from '@/components/ui/press-scale';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useBoard } from '@/features/board/board-store';
import { useFamily } from '@/features/family/family-store';
import { useSharing } from '@/features/sharing/sharing-store';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { pressFeedback, successFeedback, tapFeedback } from '@/lib/haptics';
import { pickPhoto, type PhotoSource } from '@/lib/photos';
import { useT } from '@/i18n';

const BLUE = '#208AEF';

export default function BoardScreen() {
  const t = useT();
  const now = useNow();
  const { posts } = useBoard();
  const { family, meId } = useFamily();
  const { members } = useSharing();
  const me = members.find((m) => m.id === meId) ?? null;

  return (
    <TabScreen>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.flex}>
            <ThemedText style={styles.title}>{t.board.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {family ? t.board.subtitleFamily(family.name) : t.board.subtitle}
            </ThemedText>
          </View>
          <FamilyButton />
        </View>

        {!family && <WhoAmI meId={meId} />}
        {me ? (
          <Composer meId={me.id} />
        ) : (
          <ThemedText themeColor="textSecondary" style={styles.center}>
            {t.board.pickWho}
          </ThemedText>
        )}

        {posts.length === 0 ? (
          <Animated.View entering={FadeIn} style={styles.empty}>
            <ThemedText style={styles.emptyEmoji}>💬</ThemedText>
            <ThemedText style={styles.emptyTitle}>{t.board.empty}</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.center}>
              {t.board.emptyText}
            </ThemedText>
          </Animated.View>
        ) : (
          <View style={styles.feed}>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} now={now} meId={meId} />
            ))}
          </View>
        )}
      </ScrollView>
    </TabScreen>
  );

}

/** On a shared phone (no family yet), choose who is posting. */
function WhoAmI({ meId }: { meId: string | null }) {
  const theme = useTheme();
  const t = useT();
  const { setLocalMe } = useFamily();
  const { members } = useSharing();
  return (
    <View style={styles.gap}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {t.board.whoPosting}
      </ThemedText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.whoRow}
        style={styles.bleed}>
        {members.map((m) => {
          const selected = m.id === meId;
          return (
            <PressScale
              key={m.id}
              scaleTo={0.9}
              onPress={() => {
                tapFeedback();
                setLocalMe(m.id);
              }}
              style={[
                styles.whoChip,
                {
                  borderColor: selected ? m.color : 'transparent',
                  backgroundColor: selected ? `${m.color}1A` : theme.backgroundElement,
                },
              ]}>
              <MemberAvatar member={m} size={28} />
              <ThemedText type="smallBold">{m.name}</ThemedText>
            </PressScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

function Composer({ meId }: { meId: string }) {
  const theme = useTheme();
  const t = useT();
  const toast = useToast();
  const { addPost } = useBoard();
  const { members } = useSharing();
  const me = members.find((m) => m.id === meId);
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState('');
  const [hiddenFrom, setHiddenFrom] = useState<string[]>([]);
  const [showSurprise, setShowSurprise] = useState(false);
  const [busy, setBusy] = useState(false);
  const canPost = (text.trim() || photo) && !busy;

  async function attach(source: PhotoSource) {
    tapFeedback();
    setBusy(true);
    try {
      const picked = await pickPhoto({ source, maxSize: 900 });
      if (picked) setPhoto(picked);
    } catch (e) {
      toast({ message: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  function post() {
    if (!canPost) return;
    pressFeedback();
    addPost({ memberId: meId, text: text.trim(), photo, hiddenFrom });
    successFeedback();
    toast({ message: hiddenFrom.length ? t.board.secretPosted : t.board.posted });
    setText('');
    setPhoto('');
    setHiddenFrom([]);
    setShowSurprise(false);
  }

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18)}
      style={[styles.composer, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.composerTop}>
        {me && <MemberAvatar member={me} size={40} />}
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={t.board.whatsNew(me?.name ?? t.board.there)}
          placeholderTextColor={theme.textSecondary}
          multiline
          maxLength={2000}
          style={[styles.input, { color: theme.text }]}
        />
      </View>

      {!text && !photo && <TemplatePicker onPick={setText} />}

      {photo ? (
        <Animated.View entering={ZoomIn.springify()} style={styles.preview}>
          <Image source={{ uri: photo }} style={styles.previewImage} contentFit="cover" />
          <PressScale
            onPress={() => setPhoto('')}
            accessibilityLabel={t.board.removePhoto}
            style={styles.removePhoto}>
            <ThemedText style={styles.white}>✕</ThemedText>
          </PressScale>
        </Animated.View>
      ) : null}

      {showSurprise && (
        <SurprisePicker
          title={t.surprise.postTitle}
          value={hiddenFrom}
          onChange={setHiddenFrom}
        />
      )}

      <View style={styles.actions}>
        <ToolButton label="📷" onPress={() => attach('camera')} accessibilityLabel={t.board.takePhoto} />
        <ToolButton label="🖼️" onPress={() => attach('library')} accessibilityLabel={t.board.addPhoto} />
        <ToolButton
          label="🤫"
          active={showSurprise || hiddenFrom.length > 0}
          onPress={() => {
            tapFeedback();
            setShowSurprise((v) => !v);
          }}
          accessibilityLabel={t.board.makeSecret}
        />
        <View style={styles.flex} />
        <PressScale
          disabled={!canPost}
          onPress={post}
          accessibilityRole="button"
          style={[styles.postButton, !canPost && styles.disabled]}>
          <ThemedText style={styles.white}>{t.board.post}</ThemedText>
        </PressScale>
      </View>
    </Animated.View>
  );
}

function ToolButton({
  label,
  onPress,
  active,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
  accessibilityLabel: string;
}) {
  const theme = useTheme();
  return (
    <PressScale
      scaleTo={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.tool,
        { backgroundColor: active ? '#D6409F22' : theme.background },
      ]}>
      <ThemedText style={styles.toolIcon}>{label}</ThemedText>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
  },
  white: {
    color: '#ffffff',
    fontWeight: 700,
  },
  gap: {
    gap: Spacing.two,
  },
  bleed: {
    marginHorizontal: -Spacing.three,
  },
  content: {
    padding: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.six,
    gap: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: 700,
  },
  whoRow: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  whoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingLeft: Spacing.one,
    paddingRight: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.four,
    borderWidth: 2,
  },
  composer: {
    borderRadius: 22,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  composerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  input: {
    flex: 1,
    fontSize: 17,
    minHeight: 44,
    maxHeight: 160,
    paddingTop: Spacing.two,
    textAlignVertical: 'top',
  },
  preview: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  removePhoto: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  tool: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolIcon: {
    fontSize: 20,
    lineHeight: 26,
  },
  postButton: {
    backgroundColor: BLUE,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two + Spacing.one,
    borderRadius: Spacing.four,
  },
  disabled: {
    opacity: 0.4,
  },
  feed: {
    gap: Spacing.three,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.four,
    paddingHorizontal: Spacing.four,
  },
  emptyEmoji: {
    fontSize: 56,
    lineHeight: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 700,
  },
});
