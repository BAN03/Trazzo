import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type AppIconName = ComponentProps<typeof Ionicons>['name'];

interface AppIconProps {
  name: AppIconName;
  size?: number;
  color?: string;
}

export function AppIcon({ name, size = 22, color }: AppIconProps) {
  return <Ionicons name={name} size={size} color={color} />;
}
