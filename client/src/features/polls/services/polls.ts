import { apiRequest } from '@/lib/api';

export type PollOption = {
  id: string;
  optionText: string;
  voteCount: number;
};

export type Poll = {
  id: string;
  societyId: string;
  question: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  options: PollOption[];
  totalVotes: number;
  hasVoted: boolean;
  votedOptionId: string | null;
};

export type PollResults = {
  pollId: string;
  totalVotes: number;
  options: PollOption[];
};

export type CreatePollInput = {
  question: string;
  startsAt?: string;
  endsAt: string;
  options: string[];
};

export async function fetchPolls() {
  return apiRequest<Poll[]>('/api/polls');
}

export async function createPoll(payload: CreatePollInput) {
  return apiRequest<Poll>('/api/polls', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function castVote(pollId: string, optionId: string) {
  return apiRequest<PollResults>(`/api/polls/${pollId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ optionId })
  });
}

export async function fetchPollResults(pollId: string) {
  return apiRequest<PollResults>(`/api/polls/${pollId}/results`);
}
