import { useState } from 'react';
import { ScrollView, Share, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/hooks/useColorScheme';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { QrCode } from '@/components/QrCode';
import { usePreApprovals } from '@/features/visitors/hooks/use-visitors';
import type { PreApproval } from '@/features/visitors/services/visitors';

function isExpired(pass: PreApproval) {
  return Boolean(pass.validUntil && new Date(pass.validUntil) < new Date());
}

export default function PreApprovalsListScreen() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = usePreApprovals();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const passes = data ?? [];
  const active = passes.filter((p) => p.status === 'approved' && !isExpired(p));
  const inactive = passes.filter((p) => p.status !== 'approved' || isExpired(p));

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        <ScreenHeader
          title="Pre-approved passes"
          showBack
          drawer
          onRefresh={refetch}
          isRefetching={isRefetching}
        />

        <Button
          label="New pre-approval"
          icon="add"
          onPress={() => router.push('/(app)/pre-approvals/create')}
          className="my-4"
        />

        {isLoading ? (
          <ListSkeleton rows={3} />
        ) : passes.length === 0 ? (
          <EmptyState
            variant="boxed"
            icon="key-outline"
            title="No passes yet"
            subtitle="Create a digital gate pass so your guest can skip the wait at security."
            className="mt-6"
          />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-20">
            {active.length > 0 ? (
              <>
                <SectionLabel className="mb-2">Active</SectionLabel>
                {active.map((pass, index) => (
                  <FadeIn key={pass.id} index={index}>
                    <PreApprovalCard
                      pass={pass}
                      expanded={expandedId === pass.id}
                      onToggle={() => setExpandedId(expandedId === pass.id ? null : pass.id)}
                    />
                  </FadeIn>
                ))}
              </>
            ) : null}

            {inactive.length > 0 ? (
              <>
                <SectionLabel className="mt-4 mb-2 text-muted">Past</SectionLabel>
                {inactive.map((pass, index) => (
                  <FadeIn key={pass.id} index={index}>
                    <PreApprovalCard
                      pass={pass}
                      expanded={expandedId === pass.id}
                      onToggle={() => setExpandedId(expandedId === pass.id ? null : pass.id)}
                    />
                  </FadeIn>
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
  const theme = useTheme();
  const expired = isExpired(pass);
  const isActive = pass.status === 'approved' && !expired;

  return (
    <Card onPress={onToggle} className={`p-4 mb-3 ${!isActive ? 'opacity-60' : ''}`}>
      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-base font-serif-semibold text-foreground flex-1">{pass.name}</Text>
        <Badge label={expired ? 'Expired' : pass.status} tone={isActive ? 'primary' : 'muted'} />
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
        <Animated.View
          entering={FadeInDown.duration(280).springify().damping(20)}
          className="items-center mt-4 pt-4 border-t border-border/60"
        >
          <View className="p-3 bg-white rounded-2xl">
            <QrCode value={pass.passCode} size={160} foreground="#1d1a13" background="#ffffff" />
          </View>
          <Text className="text-xs font-sans text-muted mt-3">Or share this code</Text>
          <Text className="text-2xl font-mono-semibold text-primary tracking-[6px] mt-1">
            {pass.passCode}
          </Text>
          <Button
            label="Share pass"
            icon="share-social-outline"
            variant="outline"
            size="sm"
            className="mt-4"
            onPress={() => {
              // Built-in RN share sheet — no native module needed, works
              // on every platform the app targets.
              Share.share({
                message: `Portl gate pass for ${pass.name}: ${pass.passCode}${
                  pass.validUntil
                    ? ` (valid until ${new Date(pass.validUntil).toLocaleString()})`
                    : ''
                } — show this at the gate.`
              }).catch(() => undefined);
            }}
          />
        </Animated.View>
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
    </Card>
  );
}
