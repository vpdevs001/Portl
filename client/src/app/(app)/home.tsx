import { useAppSession } from '@/lib/auth-client';
import { AdminHome } from '@/features/home/components/AdminHome';
import { ResidentHome } from '@/features/home/components/ResidentHome';
import { GuardHome } from '@/features/home/components/GuardHome';
import { ActivityIndicator, View } from 'react-native';

export default function HomeRoute() {
  const { data: session, isPending } = useAppSession();

  if (isPending) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#a9832e" />
      </View>
    );
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
