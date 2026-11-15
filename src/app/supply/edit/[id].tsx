import { useLocalSearchParams } from 'expo-router';
import { ProductForm } from '../../../components/ProductForm';

export default function EditSupplyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProductForm mode="edit" kind="supply" productId={id} />;
}
