const ForumSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  company: String,
  phone: String,
  address: String,
  country: String,
  email: String,
  createdAt: { type: Date, default: Date.now }
});
const Forum = mongoose.models.Forum || mongoose.models("Forum", ForumSchema);