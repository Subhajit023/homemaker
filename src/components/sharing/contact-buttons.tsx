import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useToast } from '@/components/toast';
import { PressScale } from '@/components/ui/press-scale';
import { Spacing } from '@/constants/theme';
import type { Member } from '@/features/sharing/types';
import { useTheme } from '@/hooks/use-theme';
import { contact, hasPhone, type ContactMethod } from '@/lib/contact';
import { tapFeedback } from '@/lib/haptics';
import { useT } from '@/i18n';

const METHODS: { method: ContactMethod; key: 'call' | 'text' | 'whatsapp'; color: string }[] = [
  { method: 'call', key: 'call', color: '#30A46C' },
  { method: 'sms', key: 'text', color: '#208AEF' },
  { method: 'whatsapp', key: 'whatsapp', color: '#25D366' },
];

type ContactButtonsProps = {
  member: Member;
  /** Pre-filled text for SMS and WhatsApp. */
  message?: string;
  compact?: boolean;
};

/** Call / Text / WhatsApp buttons for a family member. */
export function ContactButtons({ member, message = '', compact }: ContactButtonsProps) {
  const theme = useTheme();
  const t = useT();
  const toast = useToast();

  if (!hasPhone(member.phone)) {
    return (
      <PressScale
        onPress={() => {
          tapFeedback();
          router.push('/plan/manage');
        }}
        style={[styles.addPhone, { borderColor: theme.backgroundSelected }]}>
        <ThemedText type="small" themeColor="textSecondary">
          {t.contact.addPhone(member.name)}
        </ThemedText>
      </PressScale>
    );
  }

  async function open(method: ContactMethod) {
    tapFeedback();
    const ok = await contact(method, member.phone, message);
    if (!ok) {
      toast({
        message:
          method === 'whatsapp' ? t.contact.noWhatsApp : t.contact.cantOpen,
      });
    }
  }

  return (
    <View style={styles.row}>
      {METHODS.map(({ method, key, color }) => (
        <PressScale
          key={method}
          scaleTo={0.92}
          onPress={() => open(method)}
          accessibilityRole="button"
          accessibilityLabel={`${t.contact[key].slice(2).trim()} ${member.name}`}
          style={[
            styles.button,
            compact && styles.compact,
            { backgroundColor: `${color}1F` },
          ]}>
          <ThemedText type="smallBold" style={{ color }}>
            {t.contact[key]}
          </ThemedText>
        </PressScale>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two + Spacing.one,
    borderRadius: 14,
  },
  compact: {
    paddingVertical: Spacing.two,
  },
  addPhone: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: Spacing.two + Spacing.one,
    alignItems: 'center',
  },
});
