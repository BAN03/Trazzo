export interface BusinessType {
  id: string;
  label: string;
  icon: string;
}

/** Giros disponibles en el tour y en los ajustes. */
export const BUSINESS_TYPES: BusinessType[] = [
  { id: 'alimentos', label: 'Alimentos', icon: '🍔' },
  { id: 'abarrotes', label: 'Abarrotes', icon: '🛒' },
  { id: 'ropa', label: 'Ropa', icon: '👕' },
  { id: 'catalogo', label: 'Venta por catálogo', icon: '📋' },
  { id: 'otro', label: 'Otro', icon: '📦' },
];

export const getBusinessType = (id?: string | null): BusinessType | undefined =>
  BUSINESS_TYPES.find((type) => type.id === id);

export const getBusinessTypeLabel = (id?: string | null, fallback = 'Sin giro'): string =>
  getBusinessType(id)?.label ?? fallback;
