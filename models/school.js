const SchoolSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  title: String,
  phone: String,
  address: String,
  country: String,
  email: String,
  createdAt: { type: Date, default: Date.now }
});
const School = mongoose.models.School || mongoose.models("School", SchoolSchema);