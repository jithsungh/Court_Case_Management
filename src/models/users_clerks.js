const ClerkSchema = {
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
  password: {
    type: "string",
    required: true,
    minlength: 6,
  },
  courtId: {
    type: "string",
    required: true,
    unique: true,
    trim: true,
  },
  department: {
    type: "string",
    required: true,
    trim: true,
  },
  role: {
    type: "string",
    enum: ["Clerk"],
    default: "Clerk",
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

module.exports = ClerkSchema;
