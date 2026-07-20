// Society-domain TypeScript interfaces.
// These are the canonical type definitions — import from here, not from
// the old src/hooks/use-society.ts which no longer exists.

export interface Society {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  createdAt: string;
  updatedAt: string;
}

export interface SocietyDetails extends Society {
  towers: Tower[];
  flatCount: number;
  memberCount: number;
}

export interface Tower {
  id: string;
  societyId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Flat {
  id: string;
  societyId: string;
  towerId: string;
  flatNumber: string;
  floor: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserMember {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: 'resident' | 'security_guard' | 'society_admin' | null;
  societyId: string | null;
  flatId: string | null;
}
