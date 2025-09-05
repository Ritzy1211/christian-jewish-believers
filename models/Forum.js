const mongoose = require("mongoose");

const ForumSchema = new mongoose.Schema({
  name: String,
  email: String,
  topic: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Forum || mongoose.model("Forum", ForumSchema);