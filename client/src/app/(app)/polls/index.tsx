import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Screen } from '@/components/Screen';
import { DrawerButton } from '@/components/DrawerButton';
import { useAppSession } from '@/lib/auth-client';
import { useCastVote, usePolls } from '@/features/polls/hooks/use-polls';
import type { Poll } from '@/features/polls/services/polls';

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
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
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
        <View className="flex-row items-center justify-between pb-4 mb-2 border-b border-border/50">
          <View className="flex-row items-center gap-3">
            <DrawerButton />
            <View>
              <Text className="text-2xl font-serif-bold text-foreground">Polls</Text>
              <View className="flex-row items-center gap-1.5 mt-0.5">
                <View className="w-1.5 h-1.5 rounded-full bg-success" />
                <Text className="text-xs font-sans text-muted">Live results</Text>
              </View>
            </View>
          </View>

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
        </View>

        {isAdmin ? (
          <Pressable
            onPress={() => router.push('/(app)/polls/create')}
            className="flex-row items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 my-4"
          >
            <Ionicons name="add" size={18} color={theme.primaryForeground} />
            <Text className="text-sm font-sans-bold text-primary-foreground">Create poll</Text>
          </Pressable>
        ) : null}

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : polls.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-3 pb-20">
            <View className="w-14 h-14 rounded-full border border-primary/30 bg-card items-center justify-center mb-2">
              <Ionicons name="checkbox-outline" size={24} color={theme.primary} />
            </View>
            <Text className="text-base font-serif-semibold text-foreground text-center">
              No polls yet
            </Text>
            <Text className="text-sm font-sans text-foreground-secondary text-center leading-6 px-6">
              {isAdmin
                ? 'Create a poll to gather opinions from residents on society decisions.'
                : 'Polls created by your admin will appear here for you to vote on.'}
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="pb-20"
            className="mt-2"
          >
            {polls.map((poll) => (
              <PollCard key={poll.id} poll={poll} />
            ))}
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}

function PollCard({ poll }: { poll: Poll }) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const castVote = useCastVote();
  const closed = isClosed(poll);
  const showResults = poll.hasVoted || closed;
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  function handleVote() {
    if (!selectedOptionId) return;
    castVote.mutate({ pollId: poll.id, optionId: selectedOptionId });
  }

  return (
    <View className="bg-card border border-border rounded-2xl p-4 mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <View
          className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{ backgroundColor: closed ? `${theme.muted}1a` : `${theme.success}1a` }}
        >
          <Ionicons
            name={closed ? 'lock-closed-outline' : 'radio-outline'}
            size={12}
            color={closed ? theme.muted : theme.success}
          />
          <Text
            className="text-[10px] font-sans-bold uppercase tracking-wider"
            style={{ color: closed ? theme.muted : theme.success }}
          >
            {closed ? 'Closed' : 'Active'}
          </Text>
        </View>
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

          <Pressable
            onPress={handleVote}
            disabled={!selectedOptionId || castVote.isPending}
            className={`rounded-xl px-4 py-3 items-center mt-1 ${
              selectedOptionId ? 'bg-primary' : 'bg-muted/30'
            }`}
          >
            {castVote.isPending ? (
              <ActivityIndicator size="small" color={theme.primaryForeground} />
            ) : (
              <Text
                className={`text-sm font-sans-bold ${
                  selectedOptionId ? 'text-primary-foreground' : 'text-muted'
                }`}
              >
                Cast vote
              </Text>
            )}
          </Pressable>

          {castVote.isError ? (
            <Text className="text-xs font-sans text-danger mt-1">
              {castVote.error instanceof Error ? castVote.error.message : 'Failed to cast vote'}
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
            <Text className="text-[11px] font-sans-bold" style={{ color: theme.success }}>
              You voted
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// Bar-chart style results, kept live by the socket subscription in
// usePolls — vote counts here update in place as anyone in the society
// votes, with no re-fetch needed.
function PollResultsView({ poll }: { poll: Poll }) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
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
              <View
                className="h-2 rounded-full"
                style={{
                  width: `${Math.max(barWidthPct, option.voteCount > 0 ? 4 : 0)}%`,
                  backgroundColor: isMyVote ? theme.primary : theme.muted
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}
