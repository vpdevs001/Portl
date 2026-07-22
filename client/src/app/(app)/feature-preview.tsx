import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Screen } from '@/components/Screen';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FEATURE_BLUEPRINTS } from '@/constants/feature-blueprints';
import { DrawerButton } from '@/components/DrawerButton';

export default function FeaturePreviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const featureKey = (params.id as string) ?? 'maintenance';
  const config = FEATURE_BLUEPRINTS[featureKey] ?? FEATURE_BLUEPRINTS.maintenance;

  const [activeTab, setActiveTab] = useState<'preview' | 'backend'>('preview');
  const [actionDone, setActionDone] = useState(false);

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        {/* Header Bar */}
        <View className="flex-row items-center justify-between py-4 border-b border-border/60 mb-4">
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => router.back()}
              className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border active:bg-surface"
            >
              <Ionicons name="arrow-back" size={16} color={theme.foreground} />
              <Text className="text-xs font-sans-semibold text-foreground">Back</Text>
            </Pressable>
            <DrawerButton />
          </View>

          <View className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
            <Ionicons
              name="sparkles"
              size={12}
              color={colorScheme === 'dark' ? '#fbbf24' : '#d97706'}
            />
            <Text className="text-[10px] font-sans-bold text-amber-600 dark:text-amber-400">
              API READY BLUEPRINT
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 48 }}
        >
          {/* Feature Title Card */}
          <View className="p-5 bg-card border border-border rounded-2xl mb-5 gap-3">
            <View className="flex-row items-center gap-3">
              <View className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center">
                <Ionicons name={config.icon as never} size={24} color={theme.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-xl font-serif-bold text-foreground">{config.title}</Text>
                <Text className="text-xs font-sans text-muted mt-0.5">{config.roleScope}</Text>
              </View>
            </View>
            <Text className="text-xs font-sans text-foreground-secondary leading-5">
              {config.subtitle}
            </Text>
          </View>

          {/* Mode Switcher Tabs */}
          <View className="flex-row bg-surface border border-border p-1 rounded-xl mb-5">
            <Pressable
              onPress={() => setActiveTab('preview')}
              className={`flex-1 py-2.5 rounded-lg items-center ${
                activeTab === 'preview' ? 'bg-primary' : ''
              }`}
            >
              <Text
                className={`text-xs font-sans-bold ${
                  activeTab === 'preview' ? 'text-primary-foreground' : 'text-foreground-secondary'
                }`}
              >
                Interactive UI Mockup
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('backend')}
              className={`flex-1 py-2.5 rounded-lg items-center ${
                activeTab === 'backend' ? 'bg-primary' : ''
              }`}
            >
              <Text
                className={`text-xs font-sans-bold ${
                  activeTab === 'backend' ? 'text-primary-foreground' : 'text-foreground-secondary'
                }`}
              >
                Backend Endpoints &amp; Schema
              </Text>
            </Pressable>
          </View>

          {/* TAB 1: INTERACTIVE UI MOCKUP */}
          {activeTab === 'preview' ? (
            <View className="gap-4">
              <View className="p-3 bg-card border border-border/80 rounded-xl flex-row items-center justify-between">
                <Text className="text-xs font-sans-semibold text-foreground">
                  Module Preview Data
                </Text>
                <Text className="text-[11px] font-sans text-muted">
                  {config.mockData.length} items simulated
                </Text>
              </View>

              {/* Render items based on feature preview type */}
              {config.mockData.map((item, index) => (
                <View key={index} className="p-4 bg-card border border-border/80 rounded-2xl gap-2">
                  {config.previewType === 'dues' && (
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text className="text-base font-serif-semibold text-foreground">
                          {item.month}
                        </Text>
                        <Text className="text-xs font-sans text-muted">Due by {item.dueDate}</Text>
                      </View>
                      <View className="items-end gap-1">
                        <Text className="text-lg font-mono-bold text-foreground">
                          {item.amount}
                        </Text>
                        <View
                          className={`px-2.5 py-0.5 rounded-full border ${
                            item.status === 'paid'
                              ? 'bg-emerald-500/10 border-emerald-500/30'
                              : 'bg-amber-500/10 border-amber-500/30'
                          }`}
                        >
                          <Text
                            className={`text-[10px] font-sans-bold capitalize ${
                              item.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'
                            }`}
                          >
                            {item.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {config.previewType === 'amenities' && (
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1 pr-2">
                        <Text className="text-base font-serif-semibold text-foreground">
                          {item.name}
                        </Text>
                        <Text className="text-xs font-sans text-muted">
                          Capacity: {item.capacity} • {item.slots}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => setActionDone(true)}
                        className="px-3 py-2 rounded-xl bg-primary/10 border border-primary/20"
                      >
                        <Text className="text-xs font-sans-bold text-primary">{item.price}</Text>
                      </Pressable>
                    </View>
                  )}

                  {config.previewType === 'complaints' && (
                    <View className="gap-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-base font-serif-semibold text-foreground">
                          {item.title}
                        </Text>
                        <View className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                          <Text className="text-[10px] font-sans-bold text-primary capitalize">
                            {item.status.replace('_', ' ')}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-xs font-sans text-muted">
                        Category: {item.category} • Logged {item.date}
                      </Text>
                    </View>
                  )}

                  {config.previewType === 'staff' && (
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3">
                        <View className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 items-center justify-center">
                          <Ionicons name="person" size={18} color={theme.primary} />
                        </View>
                        <View>
                          <Text className="text-base font-serif-semibold text-foreground">
                            {item.name}
                          </Text>
                          <Text className="text-xs font-sans text-muted">{item.role}</Text>
                        </View>
                      </View>
                      <Pressable
                        onPress={() => setActionDone(true)}
                        className="px-3 py-1.5 rounded-xl bg-surface border border-border flex-row items-center gap-1"
                      >
                        <Ionicons name="call-outline" size={14} color={theme.primary} />
                        <Text className="text-xs font-sans-semibold text-primary">Call</Text>
                      </Pressable>
                    </View>
                  )}

                  {config.previewType === 'logs' && (
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text className="text-sm font-sans-bold text-foreground">
                          {item.visitor}
                        </Text>
                        <Text className="text-xs font-sans text-muted">
                          {item.flat} • {item.time}
                        </Text>
                      </View>
                      <View className="px-2.5 py-1 rounded-full bg-surface border border-border">
                        <Text className="text-[10px] font-sans-semibold text-foreground-secondary">
                          {item.gate || item.status}
                        </Text>
                      </View>
                    </View>
                  )}

                  {config.previewType === 'settings' && (
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-sans-medium text-foreground">{item.key}</Text>
                      <Text className="text-xs font-mono-bold text-primary">{item.value}</Text>
                    </View>
                  )}

                  {config.previewType === 'emergency' && (
                    <View className="flex-row items-center justify-between">
                      <Text className="text-base font-serif-semibold text-foreground">
                        {item.name}
                      </Text>
                      <Text className="text-sm font-mono-bold text-danger">{item.phone}</Text>
                    </View>
                  )}
                </View>
              ))}

              {actionDone && (
                <View className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 items-center">
                  <Text className="text-xs font-sans-bold text-emerald-600 dark:text-emerald-400">
                    Action simulated! The backend schema &amp; endpoints for this feature are ready.
                  </Text>
                </View>
              )}
            </View>
          ) : (
            /* TAB 2: BACKEND ENDPOINTS & SCHEMA TECHNICAL SPEC */
            <View className="gap-5">
              {/* Database Schemas */}
              <View className="p-4 bg-card border border-border rounded-2xl gap-2">
                <Text className="text-xs font-sans-bold text-primary tracking-wider uppercase">
                  Drizzle ORM Schema Tables
                </Text>
                <View className="flex-row flex-wrap gap-2 pt-1">
                  {config.schemaTables.map((table) => (
                    <View
                      key={table}
                      className="px-3 py-1.5 rounded-lg bg-surface border border-border flex-row items-center gap-1.5"
                    >
                      <Ionicons name="cube-outline" size={14} color={theme.primary} />
                      <Text className="text-xs font-mono-bold text-foreground">{table}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Fastify REST API Routes */}
              <View className="gap-3">
                <Text className="text-xs font-sans-bold text-primary tracking-wider uppercase px-1">
                  Fastify REST API Routes
                </Text>
                {config.backendRoutes.map((route, idx) => (
                  <View key={idx} className="p-4 bg-card border border-border rounded-2xl gap-1.5">
                    <View className="flex-row items-center gap-2">
                      <View
                        className={`px-2 py-0.5 rounded-md ${
                          route.method === 'GET'
                            ? 'bg-blue-500/15 border border-blue-500/30'
                            : route.method === 'POST'
                              ? 'bg-emerald-500/15 border border-emerald-500/30'
                              : 'bg-amber-500/15 border border-amber-500/30'
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-mono-bold ${
                            route.method === 'GET'
                              ? 'text-blue-500'
                              : route.method === 'POST'
                                ? 'text-emerald-500'
                                : 'text-amber-500'
                          }`}
                        >
                          {route.method}
                        </Text>
                      </View>
                      <Text className="text-xs font-mono-semibold text-foreground">
                        {route.path}
                      </Text>
                    </View>
                    <Text className="text-xs font-sans text-muted pl-1">{route.description}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Screen>
  );
}
