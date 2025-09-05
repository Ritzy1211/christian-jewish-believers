const mongoose = require("mongoose");

const MembershipSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  plan: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports =  mongoose.models.Membership || mongoose.model("Membership", MembershipSchema);