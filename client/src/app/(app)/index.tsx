import { useSocietyDetails } from '@/hooks/use-society';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

export default function AppIndex() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const { data: society, isLoading: isSocietyLoading } = useSocietyDetails();

  const handleSignOut = async () => {
    await authClient.signOut();
  };

  if (isSessionPending || isSocietyLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#a9832e" />
      </View>
    );
  }

  const user = session?.user;

  return (
    <ScrollView className="flex-1 bg-background px-6 py-12">
      {/* Profile Header Card */}
      <View className="p-6 bg-card border border-border rounded-2xl mb-6 space-y-4">
        <View className="flex-row justify-between items-start">
          <View className="space-y-1">
            <Text className="text-2xl font-serif-semibold text-foreground">
              {user?.name ?? 'Resident User'}
            </Text>
            <Text className="text-xs font-sans text-muted">{user?.email}</Text>
          </View>
          <View className="px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20">
            <Text className="text-[10px] font-sans-bold text-primary capitalize">
              {(user?.role ?? 'Resident').replace('_', ' ')}
            </Text>
          </View>
        </View>

        {user?.flatId && (
          <View className="pt-3 border-t border-border/60">
            <Text className="text-xs font-sans text-muted">
              Flat Assigned:{' '}
              <Text className="text-foreground font-sans-medium">Assigned flat unit</Text>
            </Text>
          </View>
        )}
      </View>

      {/* Society Details Card */}
      <View className="p-6 bg-card border border-border rounded-2xl mb-8 space-y-5">
        <View className="space-y-1">
          <Text className="text-xs font-sans-bold text-primary tracking-wider uppercase">Active Estate</Text>
          <Text className="text-xl font-serif-semibold text-foreground">
            {society?.name ?? 'Portl Society'}
          </Text>
          <Text className="text-xs font-sans text-muted leading-5">
            {society?.address}, {society?.city}, {society?.state} {society?.pincode}
          </Text>
        </View>

        {/* Stats Grid */}
        <View className="flex-row space-x-4 pt-2">
          <View className="flex-1 bg-surface border border-border/50 p-4 rounded-xl items-center">
            <Text className="text-2xl font-mono-semibold text-primary">{society?.flatCount ?? 0}</Text>
            <Text className="text-[10px] font-sans-medium text-foreground-secondary uppercase mt-1">Flats</Text>
          </View>

          <View className="flex-1 bg-surface border border-border/50 p-4 rounded-xl items-center">
            <Text className="text-2xl font-mono-semibold text-primary">{society?.towers?.length ?? 0}</Text>
            <Text className="text-[10px] font-sans-medium text-foreground-secondary uppercase mt-1">Towers</Text>
          </View>

          <View className="flex-1 bg-surface border border-border/50 p-4 rounded-xl items-center">
            <Text className="text-2xl font-mono-semibold text-primary">{society?.memberCount ?? 0}</Text>
            <Text className="text-[10px] font-sans-medium text-foreground-secondary uppercase mt-1">Members</Text>
          </View>
        </View>
      </View>

      {/* Admin Quick Actions */}
      {user?.role === 'society_admin' && (
        <View className="mb-8 space-y-3">
          <Text className="text-xs font-sans-bold text-primary tracking-wider uppercase">Quick Actions</Text>
          <Pressable
            onPress={() => router.push('/(onboarding)/invite-members')}
            className="w-full py-4 bg-surface border border-border active:bg-card rounded-xl items-center justify-center"
          >
            <Text className="text-foreground font-sans-semibold text-sm">Issue New Invitations</Text>
          </Pressable>
        </View>
      )}

      {/* Sign Out Action */}
      <Pressable
        onPress={handleSignOut}
        className="w-full py-4 rounded-xl bg-danger/10 border border-danger/20 active:bg-danger/20 items-center justify-center mb-16"
      >
        <Text className="text-danger font-sans-semibold text-base">Sign Out of Account</Text>
      </Pressable>
    </ScrollView>
  );
}
