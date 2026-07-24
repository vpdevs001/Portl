import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { getPollsSocket } from '@/lib/socket';
import {
  castVote,
  createPoll,
  fetchPolls,
  type CreatePollInput,
  type Poll,
  type PollResults
} from '@/features/polls/services/polls';

const POLLS_KEY = ['polls'];

function mergeResults(poll: Poll, results: PollResults): Poll {
  return {
    ...poll,
    totalVotes: results.totalVotes,
    options: poll.options.map((option) => {
      const updated = results.options.find((o) => o.id === option.id);
      return updated ? { ...option, voteCount: updated.voteCount } : option;
    })
  };
}

export function usePolls() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: POLLS_KEY, queryFn: fetchPolls });

  // Live updates (Chapter 11): every connected client — admin, resident, or
  // guard — gets pushed the same aggregate the REST endpoints would
  // otherwise need short-interval polling to approximate.
  useEffect(() => {
    const socket = getPollsSocket();

    function handleCreated(poll: Poll) {
      queryClient.setQueryData<Poll[]>(POLLS_KEY, (current) => {
        if (!current) return [poll];
        if (current.some((p) => p.id === poll.id)) return current;
        return [poll, ...current];
      });
    }

    function handleResults(results: PollResults) {
      queryClient.setQueryData<Poll[]>(POLLS_KEY, (current) =>
        current?.map((poll) => (poll.id === results.pollId ? mergeResults(poll, results) : poll))
      );
    }

    socket.on('poll:created', handleCreated);
    socket.on('poll:results', handleResults);
    socket.connect();

    return () => {
      socket.off('poll:created', handleCreated);
      socket.off('poll:results', handleResults);
      socket.disconnect();
    };
  }, [queryClient]);

  return query;
}

export function useCreatePoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePollInput) => createPoll(payload),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // The 'poll:created' socket event also pushes this to every other
      // connected client; invalidating here covers this device in case its
      // own socket connection hasn't finished (re)establishing yet.
      queryClient.invalidateQueries({ queryKey: POLLS_KEY });
    }
  });
}

export function useCastVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pollId, optionId }: { pollId: string; optionId: string }) =>
      castVote(pollId, optionId),
    onSuccess: (results, { pollId, optionId }) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.setQueryData<Poll[]>(POLLS_KEY, (current) =>
        current?.map((poll) =>
          poll.id === pollId
            ? { ...mergeResults(poll, results), hasVoted: true, votedOptionId: optionId }
            : poll
        )
      );
    }
  });
}
