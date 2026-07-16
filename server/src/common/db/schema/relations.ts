import { defineRelations } from 'drizzle-orm';
import * as identity from './identity.schema';
import * as visitors from './visitors.schema';
import * as logs from './logs.schema';
import * as community from './community.schema';
import * as amenities from './amenities.schema';
import * as payments from './payments.schema';

const schema = {
  ...identity,
  ...visitors,
  ...logs,
  ...community,
  ...amenities,
  ...payments
};

export const relations = defineRelations(schema, (r) => ({
  // ===== IDENTITY & STRUCTURE =====

  societies: {
    towers: r.many.towers(),
    flats: r.many.flats(),
    users: r.many.users(),
    staffDirectory: r.many.staffDirectory(),
    notices: r.many.notices(),
    polls: r.many.polls(),
    complaints: r.many.complaints(),
    amenities: r.many.amenities(),
    maintenanceDues: r.many.maintenanceDues(),
    visitorRequests: r.many.visitorRequests()
  },

  towers: {
    society: r.one.societies({
      from: r.towers.societyId,
      to: r.societies.id
    }),
    flats: r.many.flats()
  },

  flats: {
    society: r.one.societies({
      from: r.flats.societyId,
      to: r.societies.id
    }),
    tower: r.one.towers({
      from: r.flats.towerId,
      to: r.towers.id
    }),
    users: r.many.users(),
    complaints: r.many.complaints(),
    amenityBookings: r.many.amenityBookings(),
    maintenanceDues: r.many.maintenanceDues()
  },

  users: {
    society: r.one.societies({
      from: r.users.societyId,
      to: r.societies.id
    }),
    flat: r.one.flats({
      from: r.users.flatId,
      to: r.flats.id
    }),
    createdVisitorRequests: r.many.visitorRequests({
      alias: 'visitorRequestCreator'
    }),
    approvedVisitorRequests: r.many.visitorRequests({
      alias: 'visitorRequestApprover'
    }),
    residentEntryLogs: r.many.residentEntryLogs({
      alias: 'residentEntryLogOwner'
    })
  },

  // ===== VISITOR MANAGEMENT =====

  visitorRequests: {
    society: r.one.societies({
      from: r.visitorRequests.societyId,
      to: r.societies.id
    }),
    flat: r.one.flats({
      from: r.visitorRequests.flatId,
      to: r.flats.id
    }),
    createdByUser: r.one.users({
      from: r.visitorRequests.createdBy,
      to: r.users.id,
      alias: 'visitorRequestCreator'
    }),
    approvedByUser: r.one.users({
      from: r.visitorRequests.approvedBy,
      to: r.users.id,
      alias: 'visitorRequestApprover'
    }),
    deliveryDetails: r.one.deliveryDetails(),
    cabDetails: r.one.cabDetails(),
    serviceStaffDetails: r.one.serviceStaffDetails(),
    entryLogs: r.many.visitorEntryLogs()
  },

  deliveryDetails: {
    visitorRequest: r.one.visitorRequests({
      from: r.deliveryDetails.visitorRequestId,
      to: r.visitorRequests.id
    })
  },

  cabDetails: {
    visitorRequest: r.one.visitorRequests({
      from: r.cabDetails.visitorRequestId,
      to: r.visitorRequests.id
    })
  },

  serviceStaffDetails: {
    visitorRequest: r.one.visitorRequests({
      from: r.serviceStaffDetails.visitorRequestId,
      to: r.visitorRequests.id
    })
  },

  // ===== ENTRY / EXIT LOGS =====

  visitorEntryLogs: {
    visitorRequest: r.one.visitorRequests({
      from: r.visitorEntryLogs.visitorRequestId,
      to: r.visitorRequests.id
    }),
    entryMarkedByUser: r.one.users({
      from: r.visitorEntryLogs.entryMarkedBy,
      to: r.users.id
    }),
    exitMarkedByUser: r.one.users({
      from: r.visitorEntryLogs.exitMarkedBy,
      to: r.users.id
    })
  },

  residentEntryLogs: {
    user: r.one.users({
      from: r.residentEntryLogs.userId,
      to: r.users.id,
      alias: 'residentEntryLogOwner'
    }),
    entryMarkedByUser: r.one.users({
      from: r.residentEntryLogs.entryMarkedBy,
      to: r.users.id
    }),
    exitMarkedByUser: r.one.users({
      from: r.residentEntryLogs.exitMarkedBy,
      to: r.users.id
    })
  },

  staffDirectory: {
    society: r.one.societies({
      from: r.staffDirectory.societyId,
      to: r.societies.id
    }),
    entryLogs: r.many.staffEntryLogs()
  },

  staffEntryLogs: {
    staff: r.one.staffDirectory({
      from: r.staffEntryLogs.staffId,
      to: r.staffDirectory.id
    }),
    entryMarkedByUser: r.one.users({
      from: r.staffEntryLogs.entryMarkedBy,
      to: r.users.id
    }),
    exitMarkedByUser: r.one.users({
      from: r.staffEntryLogs.exitMarkedBy,
      to: r.users.id
    })
  },

  // ===== COMMUNITY MANAGEMENT =====

  notices: {
    society: r.one.societies({
      from: r.notices.societyId,
      to: r.societies.id
    }),
    createdByUser: r.one.users({
      from: r.notices.createdBy,
      to: r.users.id
    })
  },

  polls: {
    society: r.one.societies({
      from: r.polls.societyId,
      to: r.societies.id
    }),
    createdByUser: r.one.users({
      from: r.polls.createdBy,
      to: r.users.id
    }),
    options: r.many.pollOptions(),
    votes: r.many.pollVotes()
  },

  pollOptions: {
    poll: r.one.polls({
      from: r.pollOptions.pollId,
      to: r.polls.id
    }),
    votes: r.many.pollVotes()
  },

  pollVotes: {
    poll: r.one.polls({
      from: r.pollVotes.pollId,
      to: r.polls.id
    }),
    pollOption: r.one.pollOptions({
      from: r.pollVotes.pollOptionId,
      to: r.pollOptions.id
    }),
    user: r.one.users({
      from: r.pollVotes.userId,
      to: r.users.id
    })
  },

  complaints: {
    society: r.one.societies({
      from: r.complaints.societyId,
      to: r.societies.id
    }),
    flat: r.one.flats({
      from: r.complaints.flatId,
      to: r.flats.id
    }),
    raisedByUser: r.one.users({
      from: r.complaints.raisedBy,
      to: r.users.id
    })
  },

  // ===== AMENITIES =====

  amenities: {
    society: r.one.societies({
      from: r.amenities.societyId,
      to: r.societies.id
    }),
    bookings: r.many.amenityBookings()
  },

  amenityBookings: {
    amenity: r.one.amenities({
      from: r.amenityBookings.amenityId,
      to: r.amenities.id
    }),
    flat: r.one.flats({
      from: r.amenityBookings.flatId,
      to: r.flats.id
    }),
    bookedByUser: r.one.users({
      from: r.amenityBookings.bookedBy,
      to: r.users.id
    })
  },

  // ===== MAINTENANCE & PAYMENTS =====

  maintenanceDues: {
    society: r.one.societies({
      from: r.maintenanceDues.societyId,
      to: r.societies.id
    }),
    flat: r.one.flats({
      from: r.maintenanceDues.flatId,
      to: r.flats.id
    }),
    paymentConfirmations: r.many.paymentConfirmations()
  },

  paymentConfirmations: {
    due: r.one.maintenanceDues({
      from: r.paymentConfirmations.dueId,
      to: r.maintenanceDues.id
    }),
    flat: r.one.flats({
      from: r.paymentConfirmations.flatId,
      to: r.flats.id
    }),
    raisedByUser: r.one.users({
      from: r.paymentConfirmations.raisedBy,
      to: r.users.id,
      alias: 'paymentConfirmationRaisedBy'
    }),
    reviewedByUser: r.one.users({
      from: r.paymentConfirmations.reviewedBy,
      to: r.users.id,
      alias: 'paymentConfirmationReviewedBy'
    })
  }
}));

export type Relations = typeof relations;
