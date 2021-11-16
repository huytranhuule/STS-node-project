const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  chatroom: {
    type: String,
    ref: "Chatroom",
  },
  user: {
    type: String,
    required: "User is required!",
    ref: "User",
  },
  message: {
    type: String,
    required: "Message is required!",
  },
});

module.exports = mongoose.model("Message", messageSchema);