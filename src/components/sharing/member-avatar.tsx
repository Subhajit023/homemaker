import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { Member } from '@/features/sharing/types';

type AvatarMember = Pick<Member, 'emoji' | 'color'> & { photo?: string };

/** Member's profile picture (or emoji) in a circle with their colour as a ring. */
export function MemberAvatar({ member, size = 40 }: { member: AvatarMember; size?: number }) {
  const shape = { width: size, height: size, borderRadius: size / 2 };
  return (
    <View
      style={[
        styles.avatar,
        shape,
        { backgroundColor: `${member.color}22`, borderColor: member.color },
      ]}>
      {member.photo ? (
        <Image
          source={{ uri: member.photo }}
          style={{ width: size - 4, height: size - 4, borderRadius: (size - 4) / 2 }}
          contentFit="cover"
          transition={150}
        />
      ) : (
        <ThemedText style={{ fontSize: size * 0.5, lineHeight: size * 0.62 }}>
          {member.emoji}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    overflow: 'hidden',
  },
});
