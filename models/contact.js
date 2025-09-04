const { default: mongoose } = require("mongoose");

const ContactSchema = new mongoose.Schema({
  name: String,
  email: String,
  subject: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

const Contact = mongoose.models.Contact || mongoose.models("Contact", ContactSchema);