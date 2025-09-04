const TourSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  title: String,
  phone: String,
  address: String,
  country: String,
  email: String,
  destination: String,
  dates: String,
  createdAt: { type: Date, default: Date.now }
});
const Tour = mongoose.models.Tour || mongoose.models("Tour", TourSchema);