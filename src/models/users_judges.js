const JudgeSchema = {
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
  chamberNumber: {
    type: "string",
    required: true,
    unique: true,
    trim: true,
  },
  yearsOnBench: {
    type: "number",
    required: true,
    min: 0,
  },
  courtDistrict: {
    type: "string",
    required: true,
    trim: true,
  },
  role: {
    type: "string",
    enum: ["Judge"],
    default: "Judge",
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

module.exports = JudgeSchema;
