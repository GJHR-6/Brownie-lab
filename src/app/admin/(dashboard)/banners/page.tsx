import { getBanners } from '@/actions/banners';
import BannersClient from './BannersClient';

export default async function BannersPage() {
  const banners = await getBanners();
  return <BannersClient initialBanners={banners} />;
}
