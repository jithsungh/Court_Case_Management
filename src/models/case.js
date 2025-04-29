const CaseSchema = {
  caseNumber: {
    type: "string",
    required: true,
    unique: true,
    trim: true,
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
  plaintiff: {
    name: { type: "string", required: true },
    governmentIdType: {
      type: "string",
      required: true,
      enum: ["Aadhar", "PAN", "Driving License", "Voter ID", "Passport"],
    },
    governmentIdNumber: {
      type: "string",
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: "string",
      required: true,
      match: [/^\d{10}$/, "Invalid phone number format (10 digits required)"],
    },
  },
  defendant: {
    name: { type: "string", required: true },
    governmentIdType: {
      type: "string",
      required: true,
      enum: ["Aadhar", "PAN", "Driving License", "Voter ID", "Passport"],
    },
    governmentIdNumber: {
      type: "string",
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: "string",
      required: true,
      match: [/^\d{10}$/, "Invalid phone number format (10 digits required)"],
    },
  },
  plaintifflawyer: {
    name: { type: "string", required: true },
    barId: {
      type: "string",
      required: true,
      trim: true,
    },
  },
  defendantlawyer: {
    name: { type: "string", required: true },
    barId: {
      type: "string",
      required: true,
      trim: true,
    },
  },
  judge: {
    judgeId: {
      type: "string",
      required: true,
    },
    judgeName: {
      type: "string",
      required: true,
    },
  },
  status: {
    type: "string",
    enum: ["Processing", "Filed", "Closed", "Pending", "Open"],
    default: "Open",
  },
  closeRequestedByLawyer: {
    type: "string",
    default: null,
  },
  closeRequestStatus: {
    type: "string",
    enum: [null, "pending", "approved", "rejected"],
    default: null,
  },
  closeRequestTimestamp: {
    type: "string",
    default: null,
  },
  createdAt: {
    type: "string",
    default: "Date.now",
  },
  plaintiffEvidences: [
    {
      type: "string",
      required: true,
    },
  ],
  defendantEvidences: [
    {
      type: "string",
      required: true,
    },
  ],
  witnesses: [
    {
      name: { type: "string", required: true },
      governmentIdType: {
        type: "string",
        required: true,
        enum: ["Aadhar", "PAN", "Driving License", "Voter ID", "Passport"],
      },
      governmentIdNumber: {
        type: "string",
        required: true,
        trim: true,
      },
      phoneNumber: {
        type: "string",
        required: true,
        match: [/^\d{10}$/, "Invalid phone number format (10 digits required)"],
      },
    },
  ],
  hearings: [
    {
      type: "string",
    },
  ],
};

module.exports = CaseSchema;
