import { Text } from '@/components/ui/Text';

type PageHeaderProps = {
  title: string;
  subtitle: string;
  className?: string;
};

export function PageHeader({ title, subtitle, className = '' }: PageHeaderProps) {
  return (
    <header className={`pb-3 lg:pb-6 ${className}`}>
      <Text variant="heading" className="block text-4xl font-inter-extrabold lg:text-[42px] lg:tracking-[-0.03em]">
        {title}
      </Text>
      <Text variant="caption" color="textSecondary" className="mt-1 hidden lg:block">
        {subtitle}
      </Text>
    </header>
  );
}
