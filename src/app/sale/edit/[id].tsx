import { useLocalSearchParams } from 'expo-router';
import { SaleForm } from '../../../components/SaleForm';

export default function EditSaleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SaleForm mode="edit" saleId={id} />;
}
