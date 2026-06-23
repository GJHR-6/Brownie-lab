import { getGiftCardsAdmin } from '@/actions/giftCards';
import TarjetasRegaloClient from './TarjetasRegaloClient';

export default async function TarjetasRegaloPage() {
  const giftCards = await getGiftCardsAdmin();
  return <TarjetasRegaloClient initialGiftCards={giftCards} />;
}
