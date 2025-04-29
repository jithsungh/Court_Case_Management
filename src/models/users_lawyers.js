const LawyerSchema = {
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
  barId: {
    type: "string",
    required: true,
    unique: true,
    trim: true,
  },
  yearsOfExperience: {
    type: "number",
    required: true,
    min: 0,
  },
  specialization: {
    type: "string",
    required: true,
    trim: true,
  },
  role: {
    type: "string",
    enum: ["Lawyer"],
    default: "Lawyer",
  },
  createdAt: {
    type: "string",
    default: "Date.now",
  },
  REFRESH_TOKEN: {
    type: "string",
    default: null,
  },
  clients: {
    type: "array",
    default: [],
  },
};

module.exports = LawyerSchema;
