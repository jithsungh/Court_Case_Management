const CaseRequestSchema = {
  type: {
    type: "string",
    enum: ["new", "defense"],
    required: true,
  },
  status: {
    type: "string",
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
    required: true,
  },
  title: {
    type: "string",
    required: true,
    trim: true,
  },
  description: {
    type: "string",
    required: true,
    trim: true,
  },
  clientId: {
    type: "string",
    required: true,
  },
  lawyerId: {
    type: "string",
    required: true,
  },
  createdAt: {
    type: "string",
    default: "Date.now",
  },
};

module.exports = CaseRequestSchema;