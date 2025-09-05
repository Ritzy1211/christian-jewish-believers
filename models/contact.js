const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema({
  name: String,
  email: String,
  subject: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Contact || mongoose.model("Contact", ContactSchema);
