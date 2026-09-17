import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

/** Web equivalent of `apps/mobile/src/components/feedback/ErrorState`. */
export function ErrorState({ message = 'Something went wrong. Try again.', onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-1 px-6 py-12 text-center">
      <Icon name="alert-circle-outline" size={32} color="danger" />
      <Text variant="bodyStrong" className="mt-2">
        {message}
      </Text>
      {onRetry ? <Button label="Retry" variant="secondary" onClick={onRetry} className="mt-4" /> : null}
    </div>
  );
}
