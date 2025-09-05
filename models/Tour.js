const mongoose = require("mongoose");

const TourSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  destination: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports =  mongoose.models.Tour || mongoose.model("Tour", TourSchema);