const MembershipSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  title: String,
  phone: String,
  address: String,
  country: String,
  email: String,
  name: String,  // "Are you a Christian" field
  intoBusiness: String,
  preferredGarment: String,
  createdAt: { type: Date, default: Date.now }
});
const Membership = mongoose.models.Membership || mongoose.models("Membership", MembershipSchema);