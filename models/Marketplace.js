const MarketplaceSchema = new mongoose.Schema({
  businessName: String,
  ownerName: String,
  country: String,
  category: String,
  email: String,
  description: String,
  createdAt: { type: Date, default: Date.now }
});
const Marketplace = mongoose.models.Marketplace || mongoose.models("Marketplace", MarketplaceSchema);