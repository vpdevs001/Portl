import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
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
import { useAppSession } from '@/lib/auth-client';
import { useCastVote, usePolls } from '@/features/polls/hooks/use-polls';
import type { Poll } from '@/features/polls/services/polls';
import { getErrorMessage } from '@/lib/errors';

function isClosed(poll: Poll) {
  return new Date(poll.endsAt).getTime() <= Date.now();
}

function formatEndsAt(endsAt: string, closed: boolean) {
  const date = new Date(endsAt);
  const formatted = date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
  return closed ? `Closed ${formatted}` : `Ends ${formatted}`;
}

export default function PollsScreen() {
  const router = useRouter();
  const { data: session } = useAppSession();
  const isAdmin = session?.user?.role === 'society_admin';

  // usePolls subscribes to the live Socket.IO room for this society — vote
  // counts and newly created polls stream in without a manual refresh.
  const { data, isLoading, refetch, isRefetching } = usePolls();
  const polls = useMemo(() => {
    const list = data ?? [];
    // Active polls first (soonest-ending first), closed polls after.
    return [...list].sort((a, b) => {
      const aClosed = isClosed(a);
      const bClosed = isClosed(b);
      if (aClosed !== bClosed) return aClosed ? 1 : -1;
      return new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime();
    });
  }, [data]);

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        <ScreenHeader
          size="lg"
          title="Polls"
          subtitle="Live results"
          drawer
          onRefresh={refetch}
          isRefetching={isRefetching}
        />

        {isAdmin ? (
          <Button
            label="Create poll"
            icon="add"
            onPress={() => router.push('/(app)/polls/create')}
            className="my-4"
          />
        ) : null}

        {isLoading ? (
          <ListSkeleton rows={3} />
        ) : polls.length === 0 ? (
          <View className="flex-1 justify-center pb-20">
            <EmptyState
              icon="checkbox-outline"
              title="No polls yet"
              subtitle={
                isAdmin
                  ? 'Create a poll to gather opinions from residents on society decisions.'
                  : 'Polls created by your admin will appear here for you to vote on.'
              }
            />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="pb-20"
            className="mt-2"
          >
            {polls.map((poll, index) => (
              <FadeIn key={poll.id} index={index}>
                <PollCard poll={poll} />
              </FadeIn>
            ))}
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}

function PollCard({ poll }: { poll: Poll }) {
  const theme = useTheme();
  const castVote = useCastVote();
  const closed = isClosed(poll);
  const showResults = poll.hasVoted || closed;
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  function handleVote() {
    if (!selectedOptionId) return;
    castVote.mutate({ pollId: poll.id, optionId: selectedOptionId });
  }

  return (
    <Card className="p-4 mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <Badge
          label={closed ? 'Closed' : 'Active'}
          icon={closed ? 'lock-closed-outline' : 'radio-outline'}
          tone={closed ? 'muted' : 'success'}
        />
        <Text className="text-[11px] font-sans text-muted">
          {formatEndsAt(poll.endsAt, closed)}
        </Text>
      </View>

      <Text className="text-base font-serif-semibold text-foreground mb-3">{poll.question}</Text>

      {showResults ? (
        <PollResultsView poll={poll} />
      ) : (
        <View className="gap-2">
          {poll.options.map((option) => {
            const selected = selectedOptionId === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => setSelectedOptionId(option.id)}
                accessibilityRole="radio"
                accessibilityLabel={option.optionText}
                accessibilityState={{ selected }}
                className={`flex-row items-center gap-3 rounded-xl border px-3.5 py-3 ${
                  selected ? 'bg-primary/10 border-primary' : 'bg-surface border-border'
                }`}
              >
                <Ionicons
                  name={selected ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={selected ? theme.primary : theme.muted}
                />
                <Text className="text-sm font-sans text-foreground flex-1">
                  {option.optionText}
                </Text>
              </Pressable>
            );
          })}

          <Button
            label="Cast vote"
            loading={castVote.isPending}
            disabled={!selectedOptionId}
            onPress={handleVote}
            className="mt-1"
          />

          {castVote.isError ? (
            <Text className="text-xs font-sans text-danger mt-1">
              {getErrorMessage(castVote.error)}
            </Text>
          ) : null}
        </View>
      )}

      <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-border/60">
        <Text className="text-[11px] font-sans text-muted">
          {poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'votes'}
        </Text>
        {poll.hasVoted ? (
          <View className="flex-row items-center gap-1">
            <Ionicons name="checkmark-circle" size={12} color={theme.success} />
            <Text className="text-[11px] font-sans-bold text-success">You voted</Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

// Bar-chart style results, kept live by the socket subscription in
// usePolls — vote counts here update in place as anyone in the society
// votes, with the bar widths animating to their new share.
function PollResultsView({ poll }: { poll: Poll }) {
  const theme = useTheme();
  const maxVotes = Math.max(1, ...poll.options.map((o) => o.voteCount));

  return (
    <View className="gap-2.5">
      {poll.options.map((option) => {
        const pct =
          poll.totalVotes > 0 ? Math.round((option.voteCount / poll.totalVotes) * 100) : 0;
        const barWidthPct = Math.round((option.voteCount / maxVotes) * 100);
        const isMyVote = poll.votedOptionId === option.id;

        return (
          <View key={option.id}>
            <View className="flex-row items-center justify-between mb-1">
              <View className="flex-row items-center gap-1.5 flex-1 pr-2">
                {isMyVote ? (
                  <Ionicons name="checkmark-circle" size={13} color={theme.primary} />
                ) : null}
                <Text
                  className={`text-xs font-sans ${isMyVote ? 'font-sans-bold text-primary' : 'text-foreground-secondary'}`}
                  numberOfLines={1}
                >
                  {option.optionText}
                </Text>
              </View>
              <Text className="text-xs font-sans-bold text-foreground">{pct}%</Text>
            </View>
            <View className="h-2 rounded-full bg-surface overflow-hidden">
              <ResultBar
                widthPct={Math.max(barWidthPct, option.voteCount > 0 ? 4 : 0)}
                color={isMyVote ? theme.primary : theme.muted}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** A result bar whose width tweens to the latest vote share. */
function ResultBar({ widthPct, color }: { widthPct: number; color: string }) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(widthPct, { duration: 450 });
  }, [widthPct, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
    backgroundColor: color
  }));

  return <Animated.View className="h-2 rounded-full" style={animatedStyle} />;
}
