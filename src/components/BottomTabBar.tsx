import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type TabKey = 'home' | 'movements' | 'catalog' | 'tasks' | 'reports';

const TABS: { key: TabKey; label: string; icon: string; path: string }[] = [
  { key: 'home', label: 'Inicio', icon: '🏠', path: '/home' },
  { key: 'movements', label: 'Movimientos', icon: '💰', path: '/movements' },
  { key: 'catalog', label: 'Catálogo', icon: '📦', path: '/catalog' },
  { key: 'tasks', label: 'Tareas', icon: '✅', path: '/tasks' },
  { key: 'reports', label: 'Informes', icon: '📊', path: '/reports' },
];

export function BottomTabBar({ active }: { active: TabKey }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
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
            <Text style={[styles.tabIcon, !isActive && styles.tabIconInactive]}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E4E4E7',
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
  tabIcon: {
    fontSize: 22,
  },
  tabIconInactive: {
    opacity: 0.55,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#A1A1AA',
  },
  tabLabelActive: {
    fontWeight: '700',
    color: '#6366F1',
  },
});
