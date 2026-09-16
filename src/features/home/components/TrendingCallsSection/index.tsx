import { DiscoverySection } from '@/features/home/components/DiscoverySection';
import { TrendingCallCard } from '@/features/home/components/TrendingCallCard';
import { useTrendingCalls } from '@/features/home/hooks/useTrendingCalls';

export interface TrendingCallsSectionProps {
  onOpenPost: (postId: string) => void;
}

export function TrendingCallsSection({ onOpenPost }: TrendingCallsSectionProps) {
  const trending = useTrendingCalls();

  return (
    <DiscoverySection
      title="Trending Calls"
      status={trending.status}
      isEmpty={trending.status === 'success' && trending.data.length === 0}
      emptyMessage="No trending Calls yet. Check back soon."
      onRetry={() => trending.refetch()}
      cardWidth={260}
    >
      {trending.data?.map((item) => (
        <TrendingCallCard key={item.id} item={item} onPress={() => onOpenPost(item.id)} />
      ))}
    </DiscoverySection>
  );
}
