import { Stack } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOutLeft, LinearTransition } from 'react-native-reanimated';

import { MemberAvatar } from '@/components/sharing/member-avatar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useToast } from '@/components/toast';
import { PressScale } from '@/components/ui/press-scale';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { guessThingEmoji, MEMBER_EMOJIS, THING_EMOJIS } from '@/features/sharing/sample-data';
import { useSharing } from '@/features/sharing/sharing-store';
import type { Member } from '@/features/sharing/types';
import { useTheme } from '@/hooks/use-theme';
import { pickPhoto, type PhotoSource } from '@/lib/photos';
import { successFeedback, tapFeedback, warningFeedback } from '@/lib/haptics';
import { useT } from '@/i18n';

export default function ManageScreen() {
  const theme = useTheme();
  const t = useT();
  const toast = useToast();
  const {
    members,
    things,
    addMember,
    updateMember,
    removeMember,
    addThing,
    removeThing,
    snapshot,
    restore,
  } = useSharing();

  const [memberName, setMemberName] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [memberEmoji, setMemberEmoji] = useState(MEMBER_EMOJIS[0]);
  const [thingName, setThingName] = useState('');
  const [thingEmoji, setThingEmoji] = useState(THING_EMOJIS[0]);

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.background }];

  function remove(kind: 'member' | 'thing', id: string, label: string) {
    const before = snapshot();
    warningFeedback();
    if (kind === 'member') removeMember(id);
    else removeThing(id);
    toast({ message: t.manage.removed(label), actionLabel: t.common.undo, onAction: () => restore(before) });
  }

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen options={{ title: t.manage.title }} />
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          {/* Family */}
          <Section
            title={t.manage.family}
            hint={t.manage.familyHint}>
            {members.map((member) => (
              <Animated.View
                key={member.id}
                entering={FadeIn}
                exiting={FadeOutLeft.duration(200)}
                layout={LinearTransition.springify().damping(18)}
                style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
                <PhotoAvatar
                  member={member}
                  onChange={(photo) => updateMember(member.id, { photo })}
                />
                <View style={styles.flex}>
                  {member.userId ? (
                    <ThemedText type="small" style={styles.joined}>
                      {t.manage.onApp}
                    </ThemedText>
                  ) : null}
                  <TextInput
                    defaultValue={member.name}
                    onEndEditing={(e) => {
                      const name = e.nativeEvent.text.trim();
                      if (name && name !== member.name) updateMember(member.id, { name });
                    }}
                    placeholder={t.manage.name}
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.nameInput, { color: theme.text }]}
                  />
                  <TextInput
                    defaultValue={member.phone}
                    onEndEditing={(e) => {
                      const phone = e.nativeEvent.text.trim();
                      if (phone !== member.phone) updateMember(member.id, { phone });
                    }}
                    placeholder={t.manage.addPhone}
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="phone-pad"
                    style={[styles.phoneInput, { color: theme.textSecondary }]}
                  />
                </View>
                <RemoveButton
                  label={t.manage.removeLabel(member.name)}
                  onPress={() => remove('member', member.id, `${member.emoji} ${member.name}`)}
                />
              </Animated.View>
            ))}

            <View style={[styles.addCard, { borderColor: theme.backgroundSelected }]}>
              <ThemedText type="smallBold">{t.manage.addSomeone}</ThemedText>
              <EmojiRow choices={MEMBER_EMOJIS} value={memberEmoji} onChange={setMemberEmoji} />
              <TextInput
                value={memberName}
                onChangeText={setMemberName}
                placeholder={t.manage.namePlaceholder}
                placeholderTextColor={theme.textSecondary}
                style={inputStyle}
              />
              <TextInput
                value={memberPhone}
                onChangeText={setMemberPhone}
                placeholder={t.manage.phonePlaceholder}
                placeholderTextColor={theme.textSecondary}
                keyboardType="phone-pad"
                style={inputStyle}
              />
              <AddButton
                label={t.manage.addToFamily}
                disabled={!memberName.trim()}
                onPress={() => {
                  successFeedback();
                  addMember(memberName.trim(), memberEmoji, memberPhone.trim());
                  toast({ message: `${memberEmoji} ${t.manage.addedToFamily(memberName.trim())}` });
                  setMemberName('');
                  setMemberPhone('');
                }}
              />
            </View>
          </Section>

          {/* Things */}
          <Section title={t.manage.things} hint={t.manage.thingsHint}>
            {things.map((thing) => (
              <Animated.View
                key={thing.id}
                entering={FadeIn}
                exiting={FadeOutLeft.duration(200)}
                layout={LinearTransition.springify().damping(18)}
                style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText style={styles.thingEmoji}>{thing.emoji}</ThemedText>
                <ThemedText style={[styles.flex, styles.bold]}>{thing.name}</ThemedText>
                <RemoveButton
                  label={t.manage.removeLabel(thing.name)}
                  onPress={() => remove('thing', thing.id, `${thing.emoji} ${thing.name}`)}
                />
              </Animated.View>
            ))}

            <View style={[styles.addCard, { borderColor: theme.backgroundSelected }]}>
              <ThemedText type="smallBold">{t.manage.addThing}</ThemedText>
              <EmojiRow choices={THING_EMOJIS} value={thingEmoji} onChange={setThingEmoji} />
              <TextInput
                value={thingName}
                onChangeText={(name) => {
                  setThingName(name);
                  const guess = guessThingEmoji(name);
                  if (guess) setThingEmoji(guess);
                }}
                placeholder={t.manage.thingPlaceholder}
                placeholderTextColor={theme.textSecondary}
                style={inputStyle}
              />
              <AddButton
                label={t.manage.addThingButton}
                disabled={!thingName.trim()}
                onPress={() => {
                  successFeedback();
                  addThing(thingName.trim(), thingEmoji);
                  toast({ message: `${thingEmoji} ${t.manage.thingAdded(thingName.trim())}` });
                  setThingName('');
                }}
              />
            </View>
          </Section>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

/** Avatar with a 📷 badge; tap to take/choose/remove a profile picture. */
function PhotoAvatar({ member, onChange }: { member: Member; onChange: (photo: string) => void }) {
  const toast = useToast();
  const t = useT();

  async function choose(source: PhotoSource) {
    try {
      const photo = await pickPhoto({ source, maxSize: 256, square: true });
      if (photo) {
        successFeedback();
        onChange(photo);
      }
    } catch (e) {
      toast({ message: (e as Error).message });
    }
  }

  function open() {
    tapFeedback();
    Alert.alert(
      t.manage.picture(member.name),
      undefined,
      [
        { text: t.common.camera, onPress: () => choose('camera') },
        { text: t.common.gallery, onPress: () => choose('library') },
        member.photo
          ? { text: t.common.remove, style: 'destructive', onPress: () => onChange('') }
          : { text: t.common.cancel, style: 'cancel' },
      ],
      { cancelable: true }
    );
  }

  return (
    <PressScale
      scaleTo={0.9}
      onPress={open}
      accessibilityRole="button"
      accessibilityLabel={t.manage.changePicture(member.name)}>
      <MemberAvatar member={member} size={52} />
      <View style={styles.cameraBadge}>
        <ThemedText style={styles.cameraIcon}>📷</ThemedText>
      </View>
    </PressScale>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
        {hint && (
          <ThemedText type="small" themeColor="textSecondary">
            {hint}
          </ThemedText>
        )}
      </View>
      {children}
    </View>
  );
}

function EmojiRow({
  choices,
  value,
  onChange,
}: {
  choices: string[];
  value: string;
  onChange: (emoji: string) => void;
}) {
  const theme = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiRow}>
      {choices.map((emoji) => (
        <PressScale
          key={emoji}
          scaleTo={0.8}
          onPress={() => {
            tapFeedback();
            onChange(emoji);
          }}
          style={[styles.emojiCell, emoji === value && { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText style={styles.emoji}>{emoji}</ThemedText>
        </PressScale>
      ))}
    </ScrollView>
  );
}

function AddButton({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <PressScale
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.addButton, disabled && styles.disabled]}>
      <ThemedText style={styles.addButtonText}>{label}</ThemedText>
    </PressScale>
  );
}

function RemoveButton({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.remove, { backgroundColor: theme.backgroundSelected }]}>
      <ThemedText themeColor="textSecondary">✕</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  bold: {
    fontWeight: 700,
  },
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.five,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  section: {
    gap: Spacing.two + Spacing.one,
  },
  sectionHeader: {
    gap: Spacing.half,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: 700,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 18,
  },
  nameInput: {
    fontSize: 16,
    fontWeight: 700,
    paddingVertical: Spacing.half,
  },
  phoneInput: {
    fontSize: 14,
    paddingVertical: Spacing.half,
  },
  cameraBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#208AEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    fontSize: 12,
    lineHeight: 16,
  },
  joined: {
    color: '#30A46C',
    fontWeight: 700,
  },
  thingEmoji: {
    fontSize: 28,
    lineHeight: 34,
  },
  addCard: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 18,
    padding: Spacing.three,
    gap: Spacing.two + Spacing.one,
  },
  input: {
    fontSize: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
    borderRadius: 14,
  },
  emojiRow: {
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
  addButton: {
    backgroundColor: '#208AEF',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: 14,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: 700,
  },
  disabled: {
    opacity: 0.4,
  },
  remove: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
