import { Text } from '@/components/ui/Text';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Web equivalent of `apps/mobile/src/components/feedback/EmptyState`. */
export function EmptyState({ icon = 'search', title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-6 py-12 text-center">
      <Icon name={icon} size={32} color="textTertiary" />
      <Text variant="bodyStrong" className="mt-2">
        {title}
      </Text>
      {message ? (
        <Text variant="caption" color="textSecondary">
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} variant="secondary" onClick={onAction} className="mt-4" />
      ) : null}
    </div>
  );
}
