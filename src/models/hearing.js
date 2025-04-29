const HearingSchema = {
  caseId: {
    type: "string",
    required: true,
  },
  courtId: {
    type: "string",
    required: true,
    trim: true,
  },
  dateTime: {
    type: "string",
    required: true,
    default: "Date.now",
  },
  nextHearingDate: {
    type: "string",
    required: false,
  },
  summary: {
    type: "string",
    required: true,
    trim: true,
  },
  outcome: {
    type: "string",
    required: false,
    trim: true,
  },
  judgeId: {
    type: "string",
    required: true,
  },
  lawyerIds: [
    {
      type: "string",
    },
  ],
  clientIds: [
    {
      type: "string",
    },
  ],
  clerkId: {
    type: "string",
    required: false,
  },
  createdAt: {
    type: "string",
    default: "Date.now",
  },
  updatedAt: {
    type: "string",
    default: "Date.now",
  },
};

module.exports = HearingSchema;