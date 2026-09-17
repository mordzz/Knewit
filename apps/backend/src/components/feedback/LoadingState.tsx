import { Skeleton } from '@/components/ui/Skeleton';

export interface LoadingStateProps {
  rows?: number;
}

/** Web equivalent of `apps/mobile/src/components/feedback/LoadingState`. */
export function LoadingState({ rows = 4 }: LoadingStateProps) {
  return (
    <div className="flex flex-col gap-3" aria-label="Loading" role="progressbar">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} height={72} className="rounded-lg" />
      ))}
    </div>
  );
}
