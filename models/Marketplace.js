const mongoose = require("mongoose");

const MarketplaceSchema = new mongoose.Schema({
  businessName: String,
  ownerName: String,
  email: String,
  country: String,
  category: String,
  description: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports =  mongoose.models.Marketplace || mongoose.model("Marketplace", MarketplaceSchema);