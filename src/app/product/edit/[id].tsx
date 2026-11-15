import { useLocalSearchParams } from 'expo-router';
import { ProductForm } from '../../../components/ProductForm';

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProductForm mode="edit" kind="product" productId={id} />;
}
