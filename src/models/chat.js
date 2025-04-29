const ChatSchema = {
  caseRequestId: {
    type: "string",
    required: true,
  },
  senderId: {
    type: "string",
    required: true,
  },
  receiverId: {
    type: "string",
    required: true,
  },
  message: {
    type: "string",
    trim: true,
  },
  mediaUrl: {
    type: "string",
    trim: true,
  },
  isRead: {
    type: "boolean",
    default: false,
  },
  createdAt: {
    type: "string",
    default: "Date.now",
  },
};

module.exports = ChatSchema;