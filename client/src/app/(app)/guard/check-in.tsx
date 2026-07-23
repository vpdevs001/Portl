import { CheckedInScreen } from '@/features/visitors/components/CheckedInScreen';
import { useCheckedInVisitors } from '@/features/visitors/hooks/use-visitors';

export default function CheckInPage() {
  const { data: visitors, isLoading } = useCheckedInVisitors();

  if (isLoading) {
    return null;
  }

  return <CheckedInScreen visitors={visitors ?? []} />;
}
