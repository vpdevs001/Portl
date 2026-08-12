import { type ColorValue } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Tabs } from 'expo-router';
import { useTheme } from '@/hooks/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useNotifications } from '@/hooks/useNotifications';
import { DrawerProvider, useDrawer } from '@/context/DrawerContext';
import { RoleDrawer } from '@/components/RoleDrawer';
import { useAppSession } from '@/lib/auth-client';

function GlobalDrawerWrapper() {
  const { isOpen, closeDrawer } = useDrawer();
  return <RoleDrawer visible={isOpen} onClose={closeDrawer} />;
}

/** Tab icon with a soft pop when the tab gains focus. */
function TabIcon({
  name,
  focusedName,
  color,
  focused
}: {
  name: string;
  focusedName: string;
  color: ColorValue;
  focused: boolean;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(focused ? 1.12 : 1, { damping: 14, stiffness: 260 }) }]
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name={(focused ? focusedName : name) as never} size={22} color={color} />
    </Animated.View>
  );
}

function AppTabs() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { data: session } = useAppSession();
  // Guards get a gate-ops tab bar (Verify + Logs) instead of the community
  // tabs — their workflow is the gate, not the notice board. Notices and
  // polls remain reachable to them through the drawer.
  const isGuard = session?.user?.role === 'security_guard';

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.muted,
          tabBarStyle: {
            backgroundColor: theme.card,
            borderTopColor: theme.border,
            borderTopWidth: 1,
            elevation: 0,
            shadowOpacity: 0,
            height: 56 + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 8
          },
          tabBarLabelStyle: {
            fontFamily: 'Manrope_600SemiBold',
            fontSize: 10
          }
        }}
        screenListeners={{
          tabPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
          }
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="home-outline" focusedName="home" color={color} focused={focused} />
            )
          }}
        />
        <Tabs.Screen
          name="notices"
          options={{
            title: 'Notices',
            href: isGuard ? null : undefined,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                name="megaphone-outline"
                focusedName="megaphone"
                color={color}
                focused={focused}
              />
            )
          }}
        />
        <Tabs.Screen
          name="polls"
          options={{
            title: 'Polls',
            href: isGuard ? null : undefined,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                name="checkbox-outline"
                focusedName="checkbox"
                color={color}
                focused={focused}
              />
            )
          }}
        />
        {/* Guard-only tabs — point straight into the guard stack */}
        <Tabs.Screen
          name="guard/verify-pass"
          options={{
            title: 'Verify',
            href: isGuard ? undefined : null,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                name="qr-code-outline"
                focusedName="qr-code"
                color={color}
                focused={focused}
              />
            )
          }}
        />
        <Tabs.Screen
          name="guard/gate-logs"
          options={{
            title: 'Logs',
            href: isGuard ? undefined : null,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                name="journal-outline"
                focusedName="journal"
                color={color}
                focused={focused}
              />
            )
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                name="person-circle-outline"
                focusedName="person-circle"
                color={color}
                focused={focused}
              />
            )
          }}
        />

        {/* Hidden from bottom tab bar — accessible via Drawer Navigator & Stack */}
        <Tabs.Screen name="guard" options={{ href: null }} />
        <Tabs.Screen name="add-resident" options={{ href: null }} />
        <Tabs.Screen name="towers-flats" options={{ href: null }} />
        <Tabs.Screen name="pre-approvals" options={{ href: null }} />
        <Tabs.Screen name="complaints" options={{ href: null }} />
        <Tabs.Screen name="amenities" options={{ href: null }} />
        <Tabs.Screen name="staff-directory" options={{ href: null }} />
        <Tabs.Screen name="payments" options={{ href: null }} />
        <Tabs.Screen name="admin" options={{ href: null }} />
        <Tabs.Screen name="society-settings" options={{ href: null }} />
        <Tabs.Screen name="visitor-history" options={{ href: null }} />
      </Tabs>

      {/* Mount global drawer overlay */}
      <GlobalDrawerWrapper />
    </>
  );
}

export default function AppLayout() {
  // Registers this device's Expo push token once per session — every
  // screen under (app) is behind auth + society, so this is the right
  // place for it (vs. the root layout, which also covers sign-in).
  useNotifications();

  return (
    <DrawerProvider>
      <AppTabs />
    </DrawerProvider>
  );
}
