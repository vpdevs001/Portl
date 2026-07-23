export type DrawerItem = {
  id: string;
  label: string;
  subtitle?: string;
  icon: string;
  route: string;
  isLive: boolean;
  category?: string;
};

export const USER_ROLES = {
  SOCIETY_ADMIN: 'society_admin',
  SECURITY_GUARD: 'security_guard',
  RESIDENT: 'resident'
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const ROLE_LABELS: Record<string, string> = {
  society_admin: 'Society Admin',
  security_guard: 'Security Guard',
  resident: 'Resident'
};

export const ADMIN_DRAWER_ITEMS: DrawerItem[] = [
  // Live Admin Routes
  {
    id: 'add-resident',
    label: 'Add Resident / Guard',
    subtitle: 'Issue invite codes for flats & guards',
    icon: 'person-add-outline',
    route: '/(app)/add-resident',
    isLive: true,
    category: 'Management'
  },
  {
    id: 'towers-flats',
    label: 'Towers & Flats',
    subtitle: 'View estate structure & flat directory',
    icon: 'business-outline',
    route: '/(app)/towers-flats',
    isLive: true,
    category: 'Management'
  },
  {
    id: 'notices',
    label: 'Society Notices',
    subtitle: 'Publish & view announcements',
    icon: 'megaphone-outline',
    route: '/(app)/notices',
    isLive: true,
    category: 'Community'
  },
  {
    id: 'polls',
    label: 'Polls & Voting',
    subtitle: 'Create opinion polls for residents',
    icon: 'checkbox-outline',
    route: '/(app)/polls',
    isLive: true,
    category: 'Community'
  },
  {
    id: 'pre-approval',
    label: 'Pre-Approve Visitor',
    subtitle: 'Create digital gate pass for guests',
    icon: 'key-outline',
    route: '/(app)/pre-approvals',
    isLive: true,
    category: 'Passes & Access'
  },
  // Unbuilt Frontend Features (Backend Ready)
  {
    id: 'maintenance',
    label: 'Maintenance & Dues',
    subtitle: 'Track dues, payments & confirmations',
    icon: 'card-outline',
    route: '/(app)/feature-preview?id=maintenance',
    isLive: false,
    category: 'Backend Ready'
  },
  {
    id: 'amenities',
    label: 'Amenity Bookings',
    subtitle: 'Manage clubhouse, pool & hall slots',
    icon: 'water-outline',
    route: '/(app)/feature-preview?id=amenities',
    isLive: false,
    category: 'Backend Ready'
  },
  {
    id: 'complaints',
    label: 'Complaints & Helpdesk',
    subtitle: 'Manage resident tickets & status',
    icon: 'build-outline',
    route: '/(app)/feature-preview?id=complaints',
    isLive: false,
    category: 'Backend Ready'
  },
  {
    id: 'staff',
    label: 'Staff Directory',
    subtitle: 'Maids, drivers & maintenance staff',
    icon: 'people-outline',
    route: '/(app)/feature-preview?id=staff',
    isLive: false,
    category: 'Backend Ready'
  },
  {
    id: 'entry-logs',
    label: 'Gate Entry Logs',
    subtitle: 'Audit visitor & resident check-ins',
    icon: 'journal-outline',
    route: '/(app)/feature-preview?id=entry-logs',
    isLive: false,
    category: 'Backend Ready'
  },
  {
    id: 'society-settings',
    label: 'Society Settings',
    subtitle: 'Society parameters & configuration',
    icon: 'settings-outline',
    route: '/(app)/feature-preview?id=society-settings',
    isLive: false,
    category: 'Backend Ready'
  }
];

export const GUARD_DRAWER_ITEMS: DrawerItem[] = [
  {
    id: 'gate-desk',
    label: 'Gate Desk Home',
    subtitle: 'Manage incoming visitor requests',
    icon: 'shield-checkmark-outline',
    route: '/(app)/home',
    isLive: true,
    category: 'Gate Operations'
  },
  {
    id: 'register-visitor',
    label: 'Register Visitor',
    subtitle: 'Log walk-in, cab or delivery entry',
    icon: 'person-add-outline',
    route: '/(app)/guard/register-visitor',
    isLive: true,
    category: 'Gate Operations'
  },
  {
    id: 'pre-approval-check',
    label: 'Pre-Approved Check-in',
    subtitle: 'Verify resident invite pass codes',
    icon: 'qr-code-outline',
    route: '/(app)/guard/verify-pass',
    isLive: true,
    category: 'Gate Operations'
  },
  {
    id: 'entry-logs',
    label: 'Gate Entry Logs',
    subtitle: 'Complete gate check-in history',
    icon: 'journal-outline',
    route: '/(app)/feature-preview?id=entry-logs',
    isLive: false,
    category: 'Backend Ready'
  },
  {
    id: 'staff-checkin',
    label: 'Staff Check-in Log',
    subtitle: 'Daily staff entry & exit register',
    icon: 'badge-vr-outline',
    route: '/(app)/feature-preview?id=staff-checkin',
    isLive: false,
    category: 'Backend Ready'
  },
  {
    id: 'emergency',
    label: 'Emergency Alert Hotline',
    subtitle: 'Instant alert to admin & residents',
    icon: 'alert-circle-outline',
    route: '/(app)/feature-preview?id=emergency',
    isLive: false,
    category: 'Backend Ready'
  }
];

export const RESIDENT_DRAWER_ITEMS: DrawerItem[] = [
  {
    id: 'pre-approval',
    label: 'Pre-Approve Visitor',
    subtitle: 'Create digital gate pass for guests',
    icon: 'key-outline',
    route: '/(app)/pre-approvals',
    isLive: true,
    category: 'Passes & Access'
  },
  {
    id: 'notices',
    label: 'Society Notices',
    subtitle: 'Announcements from admin',
    icon: 'megaphone-outline',
    route: '/(app)/notices',
    isLive: true,
    category: 'Community'
  },
  {
    id: 'polls',
    label: 'Polls & Voting',
    subtitle: 'Vote on society decisions',
    icon: 'checkbox-outline',
    route: '/(app)/polls',
    isLive: true,
    category: 'Community'
  },
  {
    id: 'visitor-history',
    label: 'Visitor Entry History',
    subtitle: 'Log of guests who entered your flat',
    icon: 'time-outline',
    route: '/(app)/feature-preview?id=visitor-history',
    isLive: false,
    category: 'Backend Ready'
  },
  {
    id: 'maintenance',
    label: 'Pay Maintenance Dues',
    subtitle: 'View bills & upload payment receipts',
    icon: 'card-outline',
    route: '/(app)/feature-preview?id=maintenance',
    isLive: false,
    category: 'Backend Ready'
  },
  {
    id: 'amenities',
    label: 'Book Amenities',
    subtitle: 'Reserve clubhouse, pool & tennis court',
    icon: 'water-outline',
    route: '/(app)/feature-preview?id=amenities',
    isLive: false,
    category: 'Backend Ready'
  },
  {
    id: 'complaints',
    label: 'Log Complaint / Service',
    subtitle: 'Report maintenance & plumbing issues',
    icon: 'build-outline',
    route: '/(app)/feature-preview?id=complaints',
    isLive: false,
    category: 'Backend Ready'
  },
  {
    id: 'staff',
    label: 'Society Staff Directory',
    subtitle: 'Find verified maids, cooks & plumbers',
    icon: 'people-outline',
    route: '/(app)/feature-preview?id=staff',
    isLive: false,
    category: 'Backend Ready'
  }
];

export function getDrawerItemsForRole(role?: string): DrawerItem[] {
  if (role === USER_ROLES.SOCIETY_ADMIN) return ADMIN_DRAWER_ITEMS;
  if (role === USER_ROLES.SECURITY_GUARD) return GUARD_DRAWER_ITEMS;
  return RESIDENT_DRAWER_ITEMS;
}
