import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type BusinessIconName = ComponentProps<typeof Ionicons>['name'];

export interface BusinessType {
  id: string;
  label: string;
  icon: BusinessIconName;
}

/** Giros disponibles en el tour y en los ajustes. */
export const BUSINESS_TYPES: BusinessType[] = [
  { id: 'alimentos', label: 'Alimentos', icon: 'fast-food-outline' },
  { id: 'abarrotes', label: 'Abarrotes', icon: 'cart-outline' },
  { id: 'ropa', label: 'Ropa', icon: 'shirt-outline' },
  { id: 'catalogo', label: 'Venta por catálogo', icon: 'document-text-outline' },
  { id: 'otro', label: 'Otro', icon: 'cube-outline' },
];

export const getBusinessType = (id?: string | null): BusinessType | undefined =>
  BUSINESS_TYPES.find((type) => type.id === id);

export const getBusinessTypeLabel = (id?: string | null, fallback = 'Sin giro'): string =>
  getBusinessType(id)?.label ?? fallback;
