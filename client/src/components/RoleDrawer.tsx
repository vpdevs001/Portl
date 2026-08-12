import { Modal, View, Text, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInRight, SlideInLeft } from 'react-native-reanimated';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { authClient, useAppSession } from '@/lib/auth-client';
import { useSocietyDetails } from '@/features/society/services/use-society';
import { useColorScheme, useTheme, useThemePreference } from '@/hooks/useColorScheme';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import * as WebBrowser from 'expo-web-browser';
import { getDrawerItemsForRole, ROLE_LABELS } from '@/constants/navigation';

interface RoleDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export function RoleDrawer({ visible, onClose }: RoleDrawerProps) {
  const { width: windowWidth } = useWindowDimensions();
  const drawerWidth = Math.min(windowWidth * 0.85, 360);

  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const { setPreference } = useThemePreference();
  const { data: session } = useAppSession();
  const { data: society } = useSocietyDetails();

  const user = session?.user;
  const role = user?.role ?? 'resident';

  const handleNavigate = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    onClose();
    setTimeout(() => {
      router.push(route as never);
    }, 200);
  };

  const handleSignOut = async () => {
    onClose();
    try {
      WebBrowser.dismissAuthSession();
    } catch {}
    await authClient.signOut();
  };

  const items = getDrawerItemsForRole(role);
  const roleTitle = ROLE_LABELS[role] ?? 'Resident';

  // Group items by category, preserving the order categories first appear
  // in the array (rather than alphabetizing or hard-coding an order here).
  const categories: string[] = [];
  const itemsByCategory = new Map<string, typeof items>();
  for (const item of items) {
    const category = item.category ?? 'General';
    if (!itemsByCategory.has(category)) {
      categories.push(category);
      itemsByCategory.set(category, []);
    }
    itemsByCategory.get(category)!.push(item);
  }

  let itemIndex = 0;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1 flex-row">
        {/* Animated backdrop */}
        <Animated.View
          entering={FadeIn.duration(220)}
          className="absolute inset-0 bg-black/50"
          pointerEvents="none"
        />

        {/* Drawer panel — slides in from the left */}
        <Animated.View
          entering={SlideInLeft.duration(280).springify().damping(24).stiffness(220)}
          className="h-full bg-background border-r border-border"
          style={{ width: drawerWidth }}
        >
          <SafeAreaView style={{ flex: 1 }}>
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
                <Avatar name={user?.name} image={user?.image} size={48} />
                <View className="flex-1">
                  <Text className="text-base font-serif-semibold text-foreground" numberOfLines={1}>
                    {user?.name ?? 'User'}
                  </Text>
                  <Text className="text-xs font-sans text-muted" numberOfLines={1}>
                    {user?.email ?? ''}
                  </Text>
                  <View className="flex-row items-center gap-2 mt-1.5">
                    <Badge label={roleTitle} tone="primary" />
                    {society?.name ? (
                      <Text className="text-[11px] font-sans text-muted flex-1" numberOfLines={1}>
                        {society.name}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>
            </View>

            {/* Menu Items List — staggered entrance */}
            <ScrollView
              className="px-4 pt-4"
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
            >
              {categories.map((category) => (
                <View key={category} className="mb-5">
                  <View className="mb-2.5 px-2">
                    <Text className="text-[11px] font-sans-bold text-primary tracking-wider uppercase">
                      {category}
                    </Text>
                  </View>

                  {itemsByCategory.get(category)!.map((item) => {
                    const index = itemIndex++;
                    return (
                      <Animated.View
                        key={item.id}
                        entering={FadeInRight.delay(80 + Math.min(index, 10) * 35)
                          .duration(300)
                          .springify()
                          .damping(20)}
                      >
                        <Pressable
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
                      </Animated.View>
                    );
                  })}
                </View>
              ))}
            </ScrollView>

            {/* Footer Actions */}
            <View className="p-4 border-t border-border/80 bg-card gap-2">
              {/* Appearance mode toggle */}
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => undefined);
                  setPreference(colorScheme === 'dark' ? 'light' : 'dark');
                }}
                className="flex-row items-center justify-between p-2.5 rounded-xl bg-surface border border-border/50 active:bg-border/30"
              >
                <View className="flex-row items-center gap-2">
                  <Ionicons
                    name={colorScheme === 'dark' ? 'moon' : 'sunny'}
                    size={16}
                    color={theme.foregroundSecondary}
                  />
                  <Text className="text-xs font-sans-medium text-foreground">
                    {colorScheme === 'dark' ? 'Dark mode' : 'Light mode'}
                  </Text>
                </View>
                <View className="px-3 py-1 rounded-lg bg-primary/10 border border-primary/20">
                  <Text className="text-[11px] font-sans-bold text-primary">
                    Switch to {colorScheme === 'dark' ? 'light' : 'dark'}
                  </Text>
                </View>
              </Pressable>

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
        </Animated.View>

        {/* Touch Outside to Close */}
        <Pressable className="flex-1 h-full" onPress={onClose} />
      </View>
    </Modal>
  );
}
