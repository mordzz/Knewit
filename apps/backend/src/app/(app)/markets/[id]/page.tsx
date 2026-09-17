import { MarketDetailView } from './MarketDetailView';

export default async function MarketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MarketDetailView marketId={id} />;
}
