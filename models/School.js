const mongoose = require("mongoose");

const SchoolSchema = new mongoose.Schema({
  name: String,
  email: String,
  program: String,
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports =  mongoose.models.School || mongoose.model("School", SchoolSchema);