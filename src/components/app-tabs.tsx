import { NativeTabs } from 'expo-router/native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { useInventory } from '@/features/inventory/inventory-store';
import { getStatus } from '@/features/inventory/meta';
import { useT } from '@/i18n';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const t = useT();
  const { items } = useInventory();
  const restockCount = items.filter((item) => getStatus(item) !== 'ok').length;

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t.tabs.home}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house" md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="inventory">
        <NativeTabs.Trigger.Label>{t.tabs.items}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="shippingbox" md="inventory_2" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="restock">
        <NativeTabs.Trigger.Label>{t.tabs.shopping}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="cart" md="shopping_cart" />
        <NativeTabs.Trigger.Badge hidden={restockCount === 0}>
          {String(restockCount)}
        </NativeTabs.Trigger.Badge>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="shared">
        <NativeTabs.Trigger.Label>{t.tabs.plan}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.2" md="group" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="board">
        <NativeTabs.Trigger.Label>{t.tabs.board}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="bubble.left.and.bubble.right" md="forum" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
