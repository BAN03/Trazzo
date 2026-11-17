import { useMemo } from 'react';
import { PanResponder } from 'react-native';
import { router } from 'expo-router';

const TAB_ROUTES = ['/home', '/movements', '/catalog', '/tasks', '/reports'] as const;
export type TabRoute = (typeof TAB_ROUTES)[number];

const SWIPE_THRESHOLD = 60;

export function useTabSwipe(activeRoute: TabRoute) {
  return useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 20 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderRelease: (_, gestureState) => {
          if (Math.abs(gestureState.dx) < SWIPE_THRESHOLD) return;

          const currentIndex = TAB_ROUTES.indexOf(activeRoute);
          const nextIndex = gestureState.dx < 0 ? currentIndex + 1 : currentIndex - 1;
          const nextRoute = TAB_ROUTES[nextIndex];

          if (nextRoute) {
            router.replace(nextRoute);
          }
        },
      }).panHandlers,
    [activeRoute]
  );
}
