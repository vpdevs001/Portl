export const HOME_CONSTANTS = {
  ADMIN: {
    APP_TAG: 'Portl Admin',
    SUBTITLE: 'Society Console',
    TITLE: 'Admin Dashboard',
    DESCRIPTION: 'Visitor requests & approvals routed to you',
    ACTION_TEXT: 'Add Resident',
    EMPTY_TITLE: 'No pending approvals',
    EMPTY_SUBTITLE: 'Admin-routed visitor requests — like prospective buyers — will appear here.'
  },
  RESIDENT: {
    APP_TAG: 'Portl Home',
    SUBTITLE: 'Gate & Visitor Hub',
    TITLE: 'Gate Activity',
    DESCRIPTION: 'Real-time incoming visitor requests for your flat',
    ACTION_TEXT: 'Pre-Approve',
    EMPTY_TITLE: 'No pending visitors',
    EMPTY_SUBTITLE: 'Incoming requests from the gate will appear here.'
  },
  GUARD: {
    APP_TAG: 'Portl Security',
    SUBTITLE: 'Gate Management Desk',
    TITLE: 'Guard Gate Desk',
    DESCRIPTION: 'Incoming visitor approval queue & check-ins',
    ACTION_TEXT: 'Register'
  }
} as const;
