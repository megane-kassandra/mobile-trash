import {
  TabListProps,
  TabTriggerSlotProps
} from 'expo-router/ui';

import { StyleSheet, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export function TabButton({
  children,
  isFocused,
}: TabTriggerSlotProps) {
  return (
    <ThemedView
      type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
      style={styles.tabButtonView}
    >
      <ThemedText
        type="small"
        themeColor={isFocused ? 'text' : 'textSecondary'}
        style={isFocused ? styles.activeText : undefined}
      >
        {children}
      </ThemedText>
    </ThemedView>
  );
}

export function CustomTabList(props: TabListProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View {...props} style={[styles.tabListContainer, props.style]}>
      <View
        style={[
          styles.innerContainer,
          {
            backgroundColor: colors.background,
            borderColor: colors.backgroundElement,
          },
        ]}
      >
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
tabListContainer: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  width: '100vw',
  paddingHorizontal: 20,
  paddingTop: 10,
  paddingBottom: 12,
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'row',
  zIndex: 1000,
},

innerContainer: {
  width: '100%',
  maxWidth: 520,
  minHeight: 62,
  borderRadius: 20,
  borderWidth: 1,
  paddingHorizontal: 12,
  flexDirection: 'row',
  justifyContent: 'space-around',
  alignItems: 'center',
  elevation: 8,
},

  tabButton: {
    flex: 1,
    alignItems: 'center',
  },

  tabButtonView: {
    minWidth: 100,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 13,
    alignItems: 'center',
  },

  activeText: {
    fontWeight: '700',
  },

  pressed: {
    opacity: 0.65,
  },
});

export default function AppTabsWeb() {
  return null;
}
