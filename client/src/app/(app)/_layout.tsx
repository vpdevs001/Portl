import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Tabs } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { useNotifications } from '@/hooks/useNotifications';
import { DrawerProvider, useDrawer } from '@/context/DrawerContext';
import { RoleDrawer } from '@/components/RoleDrawer';

function GlobalDrawerWrapper() {
  const { isOpen, closeDrawer } = useDrawer();
  return <RoleDrawer visible={isOpen} onClose={closeDrawer} />;
}

function AppTabs() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();

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
            fontFamily: 'Manrope_500Medium',
            fontSize: 10
          }
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
            )
          }}
        />
        <Tabs.Screen
          name="notices"
          options={{
            title: 'Notices',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'megaphone' : 'megaphone-outline'}
                size={22}
                color={color}
              />
            )
          }}
        />
        <Tabs.Screen
          name="polls"
          options={{
            title: 'Polls',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'checkbox' : 'checkbox-outline'} size={22} color={color} />
            )
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'person-circle' : 'person-circle-outline'}
                size={22}
                color={color}
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
        <Tabs.Screen name="admin" options={{ href: null }} />
        <Tabs.Screen name="feature-preview" options={{ href: null }} />
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
