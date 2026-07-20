// Invite-domain TypeScript interfaces.
// Society and Flat types are stable cross-feature contracts — imported
// from the society feature's types module rather than duplicated here.

import type { Flat, Society } from '@/features/society/types/society.types';

export type { Flat, Society };

export interface UserSearchItem {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export interface SocietyInvite {
  id: string;
  societyId: string;
  invitedUserId: string;
  invitedBy: string;
  role: 'resident' | 'security_guard';
  flatId: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  invitedUser?: UserSearchItem;
  society?: Society;
  flat?: Flat;
}
