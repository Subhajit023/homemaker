import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutLeft, LinearTransition, ZoomIn } from 'react-native-reanimated';

import { SurpriseTag } from '@/components/family/surprise';
import { MemberAvatar } from '@/components/sharing/member-avatar';
import { ThemedText } from '@/components/themed-text';
import { useToast } from '@/components/toast';
import { PressScale } from '@/components/ui/press-scale';
import { Spacing } from '@/constants/theme';
import { useBoard } from '@/features/board/board-store';
import { REACTIONS, type Post } from '@/features/board/types';
import { useSharing } from '@/features/sharing/sharing-store';
import { formatAgo } from '@/features/sharing/time';
import { useTheme } from '@/hooks/use-theme';
import { tapFeedback, warningFeedback } from '@/lib/haptics';
import { useT } from '@/i18n';

type PostCardProps = {
  post: Post;
  now: number;
  /** Who is reacting/deleting on this phone. */
  meId: string | null;
};

export function PostCard({ post, now, meId }: PostCardProps) {
  const theme = useTheme();
  const t = useT();
  const toast = useToast();
  const { members } = useSharing();
  const { toggleReaction, removePost, restorePost } = useBoard();
  const author = members.find((m) => m.id === post.memberId);
  const mine = meId !== null && post.memberId === meId;

  function react(emoji: string) {
    if (!meId) {
      toast({ message: t.board.chooseWhoFirst });
      return;
    }
    tapFeedback();
    toggleReaction(post.id, emoji, meId);
  }

  function remove() {
    warningFeedback();
    removePost(post.id);
    toast({ message: t.board.deleted, actionLabel: t.common.undo, onAction: () => restorePost(post) });
  }

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18)}
      exiting={FadeOutLeft.duration(250)}
      layout={LinearTransition.springify().damping(18)}
      style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.header}>
        {author ? (
          <MemberAvatar member={author} size={42} />
        ) : (
          <View style={[styles.unknown, { backgroundColor: theme.backgroundSelected }]} />
        )}
        <View style={styles.flex}>
          <ThemedText style={styles.author}>{author?.name ?? t.common.someone}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatAgo(post.createdAt, now)}
          </ThemedText>
        </View>
        {mine && (
          <Pressable
            onPress={remove}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t.board.deletePost}
            style={[styles.delete, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="small" themeColor="textSecondary">
              🗑
            </ThemedText>
          </Pressable>
        )}
      </View>

      <SurpriseTag hiddenFrom={post.hiddenFrom} />

      {post.text ? <ThemedText style={styles.text}>{post.text}</ThemedText> : null}

      {post.photo ? (
        <Image
          source={{ uri: post.photo }}
          style={styles.photo}
          contentFit="cover"
          transition={200}
        />
      ) : null}

      <View style={styles.reactions}>
        {REACTIONS.map((emoji) => {
          const who = post.reactions[emoji] ?? [];
          const reacted = meId !== null && who.includes(meId);
          return (
            <PressScale
              key={emoji}
              scaleTo={0.8}
              onPress={() => react(emoji)}
              accessibilityRole="button"
              accessibilityLabel={t.board.react(emoji)}
              accessibilityState={{ selected: reacted }}
              style={[
                styles.reaction,
                {
                  backgroundColor: reacted ? '#208AEF22' : theme.background,
                  borderColor: reacted ? '#208AEF' : 'transparent',
                },
              ]}>
              <ThemedText style={styles.reactionEmoji}>{emoji}</ThemedText>
              {who.length > 0 && (
                <Animated.View key={who.length} entering={ZoomIn.springify()}>
                  <ThemedText type="smallBold" themeColor={reacted ? 'text' : 'textSecondary'}>
                    {who.length}
                  </ThemedText>
                </Animated.View>
              )}
            </PressScale>
          );
        })}
      </View>

      {/* Who reacted */}
      {Object.values(post.reactions).some((who) => who.length > 0) && (
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {Object.entries(post.reactions)
            .flatMap(([emoji, who]) =>
              who.map((id) => `${emoji} ${members.find((m) => m.id === id)?.name ?? ''}`)
            )
            .join('  ·  ')}
        </ThemedText>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  card: {
    borderRadius: 22,
    padding: Spacing.three,
    gap: Spacing.two + Spacing.one,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  unknown: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  author: {
    fontWeight: 700,
  },
  delete: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 17,
    lineHeight: 25,
  },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 16,
  },
  reactions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  reaction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two + Spacing.one,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.four,
    borderWidth: 1.5,
  },
  reactionEmoji: {
    fontSize: 18,
    lineHeight: 24,
  },
});
