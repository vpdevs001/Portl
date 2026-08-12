import { useAppSession } from '@/lib/auth-client';
import { AdminHome } from '@/features/home/components/AdminHome';
import { ResidentHome } from '@/features/home/components/ResidentHome';
import { GuardHome } from '@/features/home/components/GuardHome';
import { LoadingScreen } from '@/components/ui/Spinner';

export default function HomeRoute() {
  const { data: session, isPending } = useAppSession();

  if (isPending) {
    return <LoadingScreen />;
  }

  const role = session?.user?.role;

  if (role === 'society_admin') {
    return <AdminHome />;
  }

  if (role === 'security_guard') {
    return <GuardHome />;
  }

  return <ResidentHome />;
}
