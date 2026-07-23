import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Screen } from '@/components/Screen';
import { DrawerButton } from '@/components/DrawerButton';
import { QrCode } from '@/components/QrCode';
import { usePreApprovals } from '@/features/visitors/hooks/use-visitors';
import type { PreApproval } from '@/features/visitors/services/visitors';

function isExpired(pass: PreApproval) {
  return Boolean(pass.validUntil && new Date(pass.validUntil) < new Date());
}

export default function PreApprovalsListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const { data, isLoading, refetch, isRefetching } = usePreApprovals();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const passes = data ?? [];
  const active = passes.filter((p) => p.status === 'approved' && !isExpired(p));
  const inactive = passes.filter((p) => p.status !== 'approved' || isExpired(p));

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        <View className="flex-row items-center justify-between mb-2">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={theme.foreground} />
          </Pressable>
          <Text className="text-lg font-serif-semibold text-foreground">Pre-approved passes</Text>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => refetch()}
              hitSlop={12}
              className="w-10 h-10 rounded-xl bg-card border border-border items-center justify-center"
            >
              <Ionicons
                name="refresh"
                size={18}
                color={theme.foreground}
                style={isRefetching ? { opacity: 0.4 } : undefined}
              />
            </Pressable>
            <DrawerButton />
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/(app)/pre-approvals/create')}
          className="flex-row items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 my-4"
        >
          <Ionicons name="add" size={18} color={theme.primaryForeground} />
          <Text className="text-sm font-sans-bold text-primary-foreground">New pre-approval</Text>
        </Pressable>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : passes.length === 0 ? (
          <View className="flex-1 items-center justify-center rounded-2xl border border-dashed border-border p-6 min-h-[200px]">
            <Ionicons name="key-outline" size={28} color={theme.muted} />
            <Text className="text-base font-serif-semibold text-foreground mt-3">
              No passes yet
            </Text>
            <Text className="text-sm font-sans text-foreground-secondary text-center mt-2">
              Create a digital gate pass so your guest can skip the wait at security.
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-20">
            {active.length > 0 ? (
              <>
                <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider mb-2">
                  Active
                </Text>
                {active.map((pass) => (
                  <PreApprovalCard
                    key={pass.id}
                    pass={pass}
                    expanded={expandedId === pass.id}
                    onToggle={() => setExpandedId(expandedId === pass.id ? null : pass.id)}
                  />
                ))}
              </>
            ) : null}

            {inactive.length > 0 ? (
              <>
                <Text className="text-xs font-sans-bold text-muted uppercase tracking-wider mt-4 mb-2">
                  Past
                </Text>
                {inactive.map((pass) => (
                  <PreApprovalCard
                    key={pass.id}
                    pass={pass}
                    expanded={expandedId === pass.id}
                    onToggle={() => setExpandedId(expandedId === pass.id ? null : pass.id)}
                  />
                ))}
              </>
            ) : null}
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}

function PreApprovalCard({
  pass,
  expanded,
  onToggle
}: {
  pass: PreApproval;
  expanded: boolean;
  onToggle: () => void;
}) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const expired = isExpired(pass);
  const isActive = pass.status === 'approved' && !expired;

  return (
    <Pressable
      onPress={onToggle}
      className={`bg-card border border-border rounded-2xl p-4 mb-3 ${!isActive ? 'opacity-60' : ''}`}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-serif-semibold text-foreground">{pass.name}</Text>
        <View className={`rounded-full px-2.5 py-1 ${isActive ? 'bg-primary/10' : 'bg-surface'}`}>
          <Text
            className={`text-[10px] font-sans-bold uppercase tracking-wider ${
              isActive ? 'text-primary' : 'text-muted'
            }`}
          >
            {expired ? 'Expired' : pass.status}
          </Text>
        </View>
      </View>

      <Text className="text-sm font-sans text-foreground-secondary mt-1 capitalize">
        {pass.visitorType?.replace('_', ' ')}
        {pass.purpose ? ` — ${pass.purpose}` : ''}
      </Text>

      {pass.validFrom && pass.validUntil ? (
        <Text className="text-xs font-sans text-muted mt-2">
          {new Date(pass.validFrom).toLocaleString()} — {new Date(pass.validUntil).toLocaleString()}
        </Text>
      ) : null}

      {expanded && pass.passCode ? (
        <View className="items-center mt-4 pt-4 border-t border-border/60">
          <QrCode
            value={pass.passCode}
            size={160}
            foreground={theme.foreground}
            background={theme.card}
          />
          <Text className="text-xs font-sans text-muted mt-3">Or share this code</Text>
          <Text className="text-2xl font-sans-bold text-primary tracking-[6px] mt-1">
            {pass.passCode}
          </Text>
        </View>
      ) : null}

      <View className="flex-row items-center justify-center mt-3">
        <Ionicons
          name={expanded ? 'chevron-up' : 'qr-code-outline'}
          size={14}
          color={theme.muted}
        />
        <Text className="text-[11px] font-sans text-muted ml-1">
          {expanded ? 'Hide pass' : 'Show pass'}
        </Text>
      </View>
    </Pressable>
  );
}
