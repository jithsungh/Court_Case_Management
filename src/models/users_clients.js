
const ClientSchema = {
  fullName: {
    type: "string",
    required: true,
    trim: true,
  },
  email: {
    type: "string",
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
  },
  phoneNumber: {
    type: "string",
    required: true,
    unique: true,
  },
  password: {
    type: "string",
    required: true,
    minlength: 6,
  },
  governmentId: {
    type: "object",
    properties: {
      type: {
        type: "string",
        required: true,
        enum: ["Aadhar", "PAN", "Driving License", "Voter ID", "Passport"],
      },
      number: {
        type: "string",
        required: true,
        unique: true,
        trim: true,
      }
    },
    required: true,
  },
  role: {
    type: "string",
    enum: ["Client"],
    default: "Client",
  },
  createdAt: {
    type: "string",
    default: "Date.now",
  },
  REFRESH_TOKEN: {
    type: "string",
    default: null,
  },
};

module.exports = ClientSchema;
