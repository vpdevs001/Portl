export type FeatureMeta = {
  title: string;
  subtitle: string;
  icon: string;
  roleScope: string;
  backendRoutes: { method: string; path: string; description: string }[];
  schemaTables: string[];
  mockData: any[];
  previewType: 'dues' | 'amenities' | 'complaints' | 'staff' | 'logs' | 'settings' | 'emergency';
};

export const FEATURE_BLUEPRINTS: Record<string, FeatureMeta> = {
  maintenance: {
    title: 'Maintenance Dues & Payments',
    subtitle: 'Track monthly society dues, view invoices, and upload payment receipts.',
    icon: 'card-outline',
    roleScope: 'Society Admin & Residents',
    backendRoutes: [
      {
        method: 'GET',
        path: '/api/payments/dues',
        description: 'List pending & paid maintenance dues by flat'
      },
      {
        method: 'POST',
        path: '/api/payments/confirmations',
        description: 'Upload transaction reference & payment receipt'
      },
      {
        method: 'POST',
        path: '/api/payments/verify',
        description: 'Admin verification & receipt approval'
      }
    ],
    schemaTables: ['maintenance_dues', 'payment_confirmations'],
    previewType: 'dues',
    mockData: [
      { id: '1', month: 'July 2026', amount: '₹3,500', dueDate: '30 Jul 2026', status: 'pending' },
      { id: '2', month: 'June 2026', amount: '₹3,500', dueDate: '30 Jun 2026', status: 'paid' },
      { id: '3', month: 'May 2026', amount: '₹3,500', dueDate: '31 May 2026', status: 'paid' }
    ]
  },
  amenities: {
    title: 'Amenity Bookings',
    subtitle: 'Reserve community spaces like clubhouse, swimming pool, and sports courts.',
    icon: 'water-outline',
    roleScope: 'Society Admin & Residents',
    backendRoutes: [
      {
        method: 'GET',
        path: '/api/amenities',
        description: 'Fetch active amenities & slot availability'
      },
      {
        method: 'POST',
        path: '/api/amenities/bookings',
        description: 'Create time slot booking request'
      },
      {
        method: 'DELETE',
        path: '/api/amenities/bookings/:id',
        description: 'Cancel existing amenity booking'
      }
    ],
    schemaTables: ['amenities', 'amenity_bookings'],
    previewType: 'amenities',
    mockData: [
      {
        id: '1',
        name: 'Clubhouse Party Hall',
        capacity: '100 People',
        slots: '6 PM - 10 PM',
        price: '₹1,200/slot'
      },
      {
        id: '2',
        name: 'Olympic Swimming Pool',
        capacity: '20 People',
        slots: '6 AM - 8 AM',
        price: 'Free for Residents'
      },
      {
        id: '3',
        name: 'Badminton Court 1',
        capacity: '4 People',
        slots: '7 PM - 8 PM',
        price: 'Free'
      }
    ]
  },
  complaints: {
    title: 'Complaints & Helpdesk',
    subtitle: 'Log maintenance issues, plumbing, electrical problems, and track ticket status.',
    icon: 'build-outline',
    roleScope: 'Society Admin & Residents',
    backendRoutes: [
      {
        method: 'GET',
        path: '/api/complaints',
        description: 'List complaints by status (open, in_progress, resolved)'
      },
      {
        method: 'POST',
        path: '/api/complaints',
        description: 'Submit new complaint ticket with photo'
      },
      {
        method: 'PATCH',
        path: '/api/complaints/:id/status',
        description: 'Admin/Staff update ticket resolution status'
      }
    ],
    schemaTables: ['complaints'],
    previewType: 'complaints',
    mockData: [
      {
        id: '1',
        title: 'Elevator B Maintenance Delay',
        category: 'Infrastructure',
        status: 'in_progress',
        date: 'Yesterday'
      },
      {
        id: '2',
        title: 'Street Light Out in Sector 2',
        category: 'Electrical',
        status: 'open',
        date: '2 days ago'
      },
      {
        id: '3',
        title: 'Water Pressure Drop - Flat 402',
        category: 'Plumbing',
        status: 'resolved',
        date: '5 days ago'
      }
    ]
  },
  staff: {
    title: 'Society Staff Directory',
    subtitle: 'Directory of verified maids, drivers, electricians, and security guards.',
    icon: 'people-outline',
    roleScope: 'All Roles',
    backendRoutes: [
      {
        method: 'GET',
        path: '/api/staff/directory',
        description: 'List active society staff and contact info'
      },
      { method: 'POST', path: '/api/staff/entry', description: 'Log staff entry/exit at gate' },
      {
        method: 'POST',
        path: '/api/staff/register',
        description: 'Admin register new verified staff member'
      }
    ],
    schemaTables: ['staff_directory', 'staff_entry_logs'],
    previewType: 'staff',
    mockData: [
      {
        id: '1',
        name: 'Ramesh Kumar',
        role: 'Head Electrician',
        phone: '+91 98765 43210',
        status: 'On Duty'
      },
      {
        id: '2',
        name: 'Sunita Devi',
        role: 'Housekeeping Supervisor',
        phone: '+91 98123 45678',
        status: 'In Estate'
      },
      {
        id: '3',
        name: 'Vikram Singh',
        role: 'Security Supervisor',
        phone: '+91 97111 22334',
        status: 'On Duty'
      }
    ]
  },
  'entry-logs': {
    title: 'Gate Entry Audit Logs',
    subtitle: 'Real-time audit record of visitor and resident check-ins at society gates.',
    icon: 'journal-outline',
    roleScope: 'Society Admin & Security Guard',
    backendRoutes: [
      {
        method: 'GET',
        path: '/api/visitors/history',
        description: 'Fetch verified entry & exit logs with timestamps'
      },
      {
        method: 'GET',
        path: '/api/logs/resident-entry',
        description: 'Resident vehicle RFID & gate check-ins'
      }
    ],
    schemaTables: ['visitor_entry_logs', 'resident_entry_logs', 'staff_entry_logs'],
    previewType: 'logs',
    mockData: [
      {
        id: '1',
        visitor: 'Amazon Delivery (Rahul)',
        flat: 'Flat 304',
        time: '10:42 AM Today',
        gate: 'Main Gate 1',
        guard: 'Guard Suresh'
      },
      {
        id: '2',
        visitor: 'Guest (Amit Shah)',
        flat: 'Flat 102',
        time: '09:15 AM Today',
        gate: 'Gate 2',
        guard: 'Guard Vikram'
      },
      {
        id: '3',
        visitor: 'Zomato Rider (Karan)',
        flat: 'Flat 501',
        time: '08:30 PM Yesterday',
        gate: 'Main Gate 1',
        guard: 'Guard Suresh'
      }
    ]
  },
  'visitor-history': {
    title: 'My Visitor History',
    subtitle: 'Log of all guests, cabs, and delivery personnel authorized for your flat.',
    icon: 'time-outline',
    roleScope: 'Resident',
    backendRoutes: [
      {
        method: 'GET',
        path: '/api/visitors/history',
        description: 'Fetch resident-specific visitor logs'
      }
    ],
    schemaTables: ['visitors', 'visitor_entry_logs'],
    previewType: 'logs',
    mockData: [
      {
        id: '1',
        visitor: 'Swiggy Delivery',
        flat: 'My Flat',
        time: '01:20 PM Today',
        status: 'Approved'
      },
      {
        id: '2',
        visitor: 'Pre-Approved Guest (Priya)',
        flat: 'My Flat',
        time: 'Yesterday 5:00 PM',
        status: 'Completed'
      },
      {
        id: '3',
        visitor: 'Plumber Service',
        flat: 'My Flat',
        time: '20 Jul 2026',
        status: 'Completed'
      }
    ]
  },
  'society-settings': {
    title: 'Society Configuration & Rules',
    subtitle: 'Manage society profile, visitor pass policies, and gate rules.',
    icon: 'settings-outline',
    roleScope: 'Society Admin',
    backendRoutes: [
      { method: 'GET', path: '/api/societies/me', description: 'Fetch current society parameters' },
      {
        method: 'PATCH',
        path: '/api/societies/me',
        description: 'Update society settings & configuration'
      }
    ],
    schemaTables: ['societies'],
    previewType: 'settings',
    mockData: [
      { key: 'Pre-Approval Pass Validity', value: '24 Hours' },
      { key: 'Auto-Reject Unapproved Requests', value: '15 Minutes' },
      { key: 'Visitor Photo Requirement', value: 'Mandatory' }
    ]
  },
  'staff-checkin': {
    title: 'Staff Check-in & Register',
    subtitle: 'Guard gate desk tool for logging daily service staff entrance.',
    icon: 'badge-vr-outline',
    roleScope: 'Security Guard',
    backendRoutes: [
      {
        method: 'POST',
        path: '/api/staff/entry',
        description: 'Log staff entry with temperature/ID check'
      },
      { method: 'POST', path: '/api/staff/exit', description: 'Log staff exit' }
    ],
    schemaTables: ['staff_entry_logs'],
    previewType: 'staff',
    mockData: [
      { id: '1', name: 'Asha (Maid - Flat 201)', time: '08:00 AM', status: 'Checked In' },
      { id: '2', name: 'Raju (Driver - Flat 403)', time: '08:30 AM', status: 'Checked In' }
    ]
  },
  emergency: {
    title: 'Emergency SOS Hotline',
    subtitle: 'Broadcast emergency panic alert to security guards and society admin.',
    icon: 'alert-circle-outline',
    roleScope: 'All Roles',
    backendRoutes: [
      {
        method: 'POST',
        path: '/api/emergency/alert',
        description: 'Trigger immediate push notification alert'
      }
    ],
    schemaTables: ['logs'],
    previewType: 'emergency',
    mockData: [
      { name: 'Gate 1 Security Desk', phone: '+91 99000 11122' },
      { name: 'Society Admin Hotline', phone: '+91 99000 33344' },
      { name: 'Medical Emergency', phone: '108' }
    ]
  }
};
