import { useTheme } from '../hooks/useTheme';
import type { Theme } from '../constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type TabKey = 'home' | 'movements' | 'catalog' | 'tasks' | 'reports';
type IconName = keyof typeof Ionicons.glyphMap;

const TABS: {
  key: TabKey;
  label: string;
  activeIcon: IconName;
  inactiveIcon: IconName;
  path: string;
}[] = [
  { key: 'home', label: 'Inicio', activeIcon: 'home', inactiveIcon: 'home-outline', path: '/home' },
  {
    key: 'movements',
    label: 'Movimientos',
    activeIcon: 'swap-vertical',
    inactiveIcon: 'swap-vertical-outline',
    path: '/movements',
  },
  {
    key: 'catalog',
    label: 'Catálogo',
    activeIcon: 'pricetags',
    inactiveIcon: 'pricetags-outline',
    path: '/catalog',
  },
  {
    key: 'tasks',
    label: 'Tareas',
    activeIcon: 'checkbox',
    inactiveIcon: 'checkbox-outline',
    path: '/tasks',
  },
  {
    key: 'reports',
    label: 'Informes',
    activeIcon: 'stats-chart',
    inactiveIcon: 'stats-chart-outline',
    path: '/reports',
  },
];

export function BottomTabBar({ active }: { active: TabKey }) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => {
              if (!isActive) router.replace(tab.path as never);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
          >
            <Ionicons
              name={isActive ? tab.activeIcon : tab.inactiveIcon}
              size={22}
              color={isActive ? theme.primary : theme.textSecondary}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: theme.textSecondary },
                isActive && { color: theme.primary },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: theme.card,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingTop: 8,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 60,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});
