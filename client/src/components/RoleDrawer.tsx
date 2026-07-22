import { Modal, View, Text, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { authClient } from '@/lib/auth-client';
import { useSocietyDetails } from '@/features/society/services/use-society';
import { Colors } from '@/constants/colors';
import { useColorScheme, useThemePreference } from '@/hooks/useColorScheme';
import * as WebBrowser from 'expo-web-browser';
import { getDrawerItemsForRole, ROLE_LABELS } from '@/constants/navigation';

interface RoleDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export function RoleDrawer({ visible, onClose }: RoleDrawerProps) {
  const { width: windowWidth } = useWindowDimensions();
  const drawerWidth = windowWidth * 0.85;

  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const { setPreference } = useThemePreference();
  const { data: session } = authClient.useSession();
  const { data: society } = useSocietyDetails();

  const user = session?.user;
  const role = user?.role ?? 'resident';

  const handleNavigate = (route: string) => {
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 150);
  };

  const handleSignOut = async () => {
    onClose();
    try {
      WebBrowser.dismissAuthSession();
    } catch {}
    await authClient.signOut();
  };

  const items = getDrawerItemsForRole(role);
  const liveItems = items.filter((i) => i.isLive);
  const backendItems = items.filter((i) => !i.isLive);
  const roleTitle = ROLE_LABELS[role] ?? 'Resident';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 flex-row bg-black/50">
        {/* Drawer Panel — 75% Screen Width */}
        <View
          className="h-full bg-background border-r border-border shadow-2xl"
          style={{ width: drawerWidth }}
        >
          <SafeAreaView className="flex-1" style={{ flex: 1 }}>
            {/* Header */}
            <View className="px-5 pt-4 pb-5 border-b border-border/80 bg-card">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-2">
                  <View className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <Text className="text-xs font-sans-bold uppercase tracking-wider text-primary">
                    Portl Navigator
                  </Text>
                </View>
                <Pressable
                  onPress={onClose}
                  className="w-8 h-8 rounded-full bg-surface border border-border/60 items-center justify-center active:bg-border/30"
                >
                  <Ionicons name="close" size={18} color={theme.foreground} />
                </Pressable>
              </View>

              {/* User Profile Card */}
              <View className="flex-row items-center gap-3">
                <View className="w-12 h-12 rounded-full overflow-hidden bg-primary/10 border border-primary/20 items-center justify-center">
                  {user?.image ? (
                    <Image
                      source={{ uri: user.image }}
                      style={{ width: 48, height: 48 }}
                      contentFit="cover"
                    />
                  ) : (
                    <Text className="text-primary font-serif-bold text-lg">
                      {(user?.name ?? 'U').charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-base font-serif-semibold text-foreground" numberOfLines={1}>
                    {user?.name ?? 'User'}
                  </Text>
                  <Text className="text-xs font-sans text-muted" numberOfLines={1}>
                    {user?.email ?? ''}
                  </Text>
                  <View className="flex-row items-center gap-2 mt-1">
                    <View className="px-2 py-0.5 rounded-md bg-primary/15 border border-primary/25">
                      <Text className="text-[10px] font-sans-bold text-primary capitalize">
                        {roleTitle}
                      </Text>
                    </View>
                    {society?.name && (
                      <Text className="text-[11px] font-sans text-muted" numberOfLines={1}>
                        • {society.name}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>

            {/* Menu Items List */}
            <ScrollView
              className="px-4 pt-4"
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
            >
              {/* Category: Live Screens */}
              <View className="mb-5">
                <View className="flex-row items-center justify-between mb-2.5 px-2">
                  <Text className="text-[11px] font-sans-bold text-primary tracking-wider uppercase">
                    Active Features
                  </Text>
                  <View className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                    <Text className="text-[9px] font-sans-bold text-emerald-600 dark:text-emerald-400">
                      LIVE
                    </Text>
                  </View>
                </View>

                {liveItems.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => handleNavigate(item.route)}
                    className="flex-row items-center gap-3 p-3 mb-1.5 rounded-xl bg-card border border-border/60 active:bg-surface"
                  >
                    <View className="w-9 h-9 rounded-lg bg-primary/10 items-center justify-center">
                      <Ionicons name={item.icon as never} size={18} color={theme.primary} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-sans-semibold text-foreground">
                        {item.label}
                      </Text>
                      {item.subtitle && (
                        <Text className="text-[11px] font-sans text-muted" numberOfLines={1}>
                          {item.subtitle}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={theme.muted} />
                  </Pressable>
                ))}
              </View>

              {/* Category: Backend Ready Dummy Features */}
              {backendItems.length > 0 && (
                <View className="mb-4">
                  <View className="flex-row items-center justify-between mb-2.5 px-2">
                    <Text className="text-[11px] font-sans-bold text-amber-600 dark:text-amber-400 tracking-wider uppercase">
                      Backend Built (Preview)
                    </Text>
                    <View className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                      <Text className="text-[9px] font-sans-bold text-amber-600 dark:text-amber-400">
                        API READY
                      </Text>
                    </View>
                  </View>

                  {backendItems.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => handleNavigate(item.route)}
                      className="flex-row items-center gap-3 p-3 mb-1.5 rounded-xl bg-surface border border-border/40 active:bg-card opacity-90"
                    >
                      <View className="w-9 h-9 rounded-lg bg-amber-500/10 items-center justify-center">
                        <Ionicons
                          name={item.icon as never}
                          size={18}
                          color={colorScheme === 'dark' ? '#fbbf24' : '#d97706'}
                        />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center gap-1.5">
                          <Text className="text-sm font-sans-medium text-foreground">
                            {item.label}
                          </Text>
                        </View>
                        {item.subtitle && (
                          <Text className="text-[11px] font-sans text-muted" numberOfLines={1}>
                            {item.subtitle}
                          </Text>
                        )}
                      </View>
                      <Ionicons name="sparkles-outline" size={14} color={theme.primary} />
                    </Pressable>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Footer Actions */}
            <View className="p-4 border-t border-border/80 bg-card gap-2">
              {/* Appearance mode toggle */}
              <View className="flex-row items-center justify-between p-2 rounded-xl bg-surface border border-border/50">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="moon-outline" size={16} color={theme.foregroundSecondary} />
                  <Text className="text-xs font-sans-medium text-foreground">Theme</Text>
                </View>
                <Pressable
                  onPress={() => setPreference(colorScheme === 'dark' ? 'light' : 'dark')}
                  className="px-3 py-1 rounded-lg bg-primary/10 border border-primary/20"
                >
                  <Text className="text-[11px] font-sans-bold text-primary capitalize">
                    {colorScheme}
                  </Text>
                </Pressable>
              </View>

              {/* Sign Out Button */}
              <Pressable
                onPress={handleSignOut}
                className="flex-row items-center justify-center gap-2 p-2.5 rounded-xl bg-danger/10 border border-danger/20 active:bg-danger/20"
              >
                <Ionicons name="log-out-outline" size={16} color={theme.danger} />
                <Text className="text-xs font-sans-bold text-danger">Sign Out</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </View>

        {/* Touch Outside to Close */}
        <Pressable className="flex-1 h-full" onPress={onClose} />
      </View>
    </Modal>
  );
}
