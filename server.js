const mongoose = require("mongoose");
require('dotenv').config();
// Import models
const Contact = require("./models/contact");
const Forum = require("./models/Forum");
const Membership = require("./models/Membership");
const School = require("./models/School");
const Tour = require("./models/Tour");
const Marketplace = require("./models/Marketplace");
const Product = require("./models/Product");
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Ensure needed folders exist ----------
function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}
ensureDir(path.join(__dirname, 'data'));
ensureDir(path.join(__dirname, 'public'));
ensureDir(path.join(__dirname, 'public', 'data'));
ensureDir(path.join(__dirname, 'public', 'uploads'));

// ---------- Sync products.json to /public/data ----------
const syncPublicProducts = () => {
  const source = path.join(__dirname, 'data', 'products.json');
  const destination = path.join(__dirname, 'public', 'data', 'products.json');

  if (fs.existsSync(source)) {
    fs.copyFileSync(source, destination);
    console.log('✔ products.json synced to public/data');
  }
};

const productsFile = path.join(__dirname, 'data', 'products.json');

// ---------- Middleware ----------
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Static
app.use(express.static(path.join(__dirname, 'public')));
// Explicit uploads static (prevents 404s like /uploads/<filename>)
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// ---------- File Upload (multer) ----------
const upload = multer({ dest: path.join(__dirname, 'public', 'uploads') });

// ---------- Email (Nodemailer) ----------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Gmail address
    pass: process.env.EMAIL_PASS  // Gmail App Password
  }
});

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB Atlas"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// ===================================================================
//                         ROUTES
// ===================================================================

// ---------- Marketplace Registration ----------

app.post("/submit-marketplace", async (req, res) => {
  try {
    const { businessName, ownerName, country, email, category, description } = req.body;
    if (!businessName || !ownerName || !country || !email || !category || !description) {
      return res.status(400).send("Missing required fields.");
    }

    const doc = await Marketplace.create({ businessName, ownerName, country, email, category, description });

    try {
      // confirmation to registrant
      await transporter.sendMail({
        from: `"Christian Jewish Believers" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Marketplace Registration Received",
        html: `
          <h2>Thank you, ${ownerName}!</h2>
          <p>We’ve received your business registration for <strong>${businessName}</strong>.</p>
        `
      });

      // notification to admin
      await transporter.sendMail({
        from: `"CJB Website" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL || process.env.CONTACT_EMAIL,
        subject: "📥 New Marketplace Registration",
        html: `
          <h2>New Marketplace Registration</h2>
          <p><strong>Business:</strong> ${businessName}</p>
          <p><strong>Owner:</strong> ${ownerName}</p>
          <p><strong>Country:</strong> ${country}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Category:</strong> ${category}</p>
          <p><strong>Description:</strong> ${description}</p>
          <p><em>Submitted at ${new Date().toLocaleString()}</em></p>
        `
      });
    } catch (mailErr) {
      console.error("Email error (marketplace):", mailErr);
    }

    res.redirect("/success.html");
  } catch (err) {
    console.error("Error saving marketplace:", err);
    res.status(500).send("Error submitting form");
  }
});


// PRODUCT (keeps multer for image)

  app.post("/submit-product", upload.single("image"), async (req, res) => {
  try {
    const { name, category, price, description } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const doc = await Product.create({ name, category, price, description, image: imagePath });

    // (Optional) notify admin about new product
    try {
      await transporter.sendMail({
        from: `"CJB Website" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL || process.env.CONTACT_EMAIL,
        subject: "📥 New Product Submitted",
        html: `
          <h2>New Product</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Category:</strong> ${category}</p>
          <p><strong>Price:</strong> ${price}</p>
          <p><strong>Description:</strong> ${description}</p>
          <p><strong>Image:</strong> ${imagePath || 'N/A'}</p>
        `
      });
    } catch (mailErr) {
      console.error("Email error (product):", mailErr);
    }

    res.redirect("/products.html");
  } catch (err) {
    console.error("Error saving product:", err);
    res.status(500).send("Error submitting product");
  }
}); 

// ---------- Membership Registration ----------
app.post("/submit-membership", async (req, res) => {
  try {
    // map the odd 'name' field (your form used name="name" for "Are you a Christian")
    const isChristian = req.body.isChristian || req.body.name || req.body.christian;
    const {
      firstName, lastName, title, phone, address, country, email, intoBusiness, preferredGarment
    } = req.body;

    if (!firstName || !lastName || !email || !country) {
      return res.status(400).send("Missing required fields.");
    }

    const doc = await Membership.create({
      firstName, lastName, title, phone, address, country, email,
      isChristian, intoBusiness, preferredGarment
    });

    try {
      // Confirmation to member
      await transporter.sendMail({
        from: `"Christian Jewish Believers" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Membership Registration Received",
        html: `
          <h2>Dear ${firstName},</h2>
          <p>Your membership application has been received. Thank you!</p>
        `
      });

      // Notification to admin
      await transporter.sendMail({
        from: `"CJB Website" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL || process.env.CONTACT_EMAIL,
        subject: "📥 New Membership Application Received",
        html: `
          <h2>New Membership Application</h2>
          <p><strong>Name:</strong> ${firstName} ${lastName}</p>
          <p><strong>Title:</strong> ${title || "N/A"}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || "N/A"}</p>
          <p><strong>Address:</strong> ${address || "N/A"}</p>
          <p><strong>Country:</strong> ${country || "N/A"}</p>
          <p><strong>Christian:</strong> ${isChristian || "N/A"}</p>
          <p><strong>Into Business:</strong> ${intoBusiness || "N/A"}</p>
          <p><strong>Preferred Garments:</strong> ${preferredGarment || "N/A"}</p>
          <p><em>Submitted at ${new Date().toLocaleString()}</em></p>
        `
      });
    } catch (mailErr) {
      console.error("Email error (membership):", mailErr);
    }

    res.redirect("/success.html");
  } catch (err) {
    console.error("Error saving membership:", err);
    res.status(500).send("Error submitting form");
  }
});

// MEMBERSHIP ALT (returns JSON)
app.post("/submit-membership-alt", async (req, res) => {
  try {
    const isChristian = req.body.isChristian || req.body.name || req.body.christian;
    const {
      firstName, lastName, title, phone, address, country, email, intoBusiness, preferredGarment
    } = req.body;

    const doc = await Membership.create({
      firstName, lastName, title, phone, address, country, email,
      isChristian, intoBusiness, preferredGarment
    });

    res.json({ success: true, message: "Membership submitted successfully!", doc });
  } catch (err) {
    console.error("Error saving membership-alt:", err);
    res.status(500).json({ success: false, message: "Failed to save membership." });
  }
});

// ---------- School of Eschatology Form Submission ----------
app.post("/submit-school", async (req, res) => {
  try {
    const { firstName, lastName, title, phone, address, country, email } = req.body;
    if (!firstName || !lastName || !email) {
      return res.status(400).send("First Name, Last Name, and Email are required");
    }

    const doc = await School.create({ firstName, lastName, title, phone, address, country, email });

    try {
      // applicant confirmation
      await transporter.sendMail({
        from: `"Christian Jewish Believers" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "School of Eschatology Registration Received",
        html: `
          <h2>Dear ${title ? title + " " : ""}${firstName} ${lastName},</h2>
          <p>Thank you for registering with the Messianic School of Eschatology & Jewish Root.</p>
        `
      });

      // admin notification
      await transporter.sendMail({
        from: `"CJB Website" <${process.env.EMAIL_USER}>`,
        to: process.env.SCHOOL_EMAIL || process.env.ADMIN_EMAIL || process.env.CONTACT_EMAIL,
        subject: "📥 New School of Eschatology Registration",
        html: `
          <h2>New School Registration</h2>
          <p><strong>Name:</strong> ${title ? title + " " : ""}${firstName} ${lastName}</p>
          <p><strong>Phone:</strong> ${phone || "N/A"}</p>
          <p><strong>Address:</strong> ${address || "N/A"}</p>
          <p><strong>Country:</strong> ${country || "N/A"}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><em>Submitted at ${new Date().toLocaleString()}</em></p>
        `
      });
    } catch (mailErr) {
      console.error("Email error (school):", mailErr);
    }

    res.redirect("/success.html");
  } catch (err) {
    console.error("Error saving school:", err);
    res.status(500).send("Error submitting form");
  }
});


// ---------- Tour Form Submission (applicant + admin emails) ----------
app.post("/submit-tour", async (req, res) => {
  try {
    const { firstName, lastName, title, phone, address, country, email, destination, dates } = req.body;
    if (!firstName || !lastName || !email || !destination) {
      return res.status(400).send("First Name, Last Name, Email and Destination are required");
    }

    const doc = await Tour.create({ firstName, lastName, title, phone, address, country, email, destination, dates });

    try {
      // applicant confirmation
      await transporter.sendMail({
        from: `"Christian Jewish Believers" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Tour Registration Received",
        html: `
          <h2>Dear ${title ? title + " " : ""}${firstName} ${lastName},</h2>
          <p>Thank you for registering for the tour.</p>
          <p><strong>Destination:</strong> ${destination}</p>
          <p><strong>Preferred Dates:</strong> ${dates || "N/A"}</p>
        `
      });

      // admin notification
      await transporter.sendMail({
        from: `"CJB Website" <${process.env.EMAIL_USER}>`,
        to: process.env.TOUR_EMAIL || process.env.ADMIN_EMAIL || process.env.CONTACT_EMAIL,
        subject: "📥 New Tour Registration",
        html: `
          <h2>New Tour Registration</h2>
          <p><strong>Name:</strong> ${title ? title + " " : ""}${firstName} ${lastName}</p>
          <p><strong>Phone:</strong> ${phone || "N/A"}</p>
          <p><strong>Address:</strong> ${address || "N/A"}</p>
          <p><strong>Country:</strong> ${country || "N/A"}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Destination:</strong> ${destination}</p>
          <p><strong>Preferred Dates:</strong> ${dates || "N/A"}</p>
          <p><em>Submitted at ${new Date().toLocaleString()}</em></p>
        `
      });
    } catch (mailErr) {
      console.error("Email error (tour):", mailErr);
    }

    res.redirect("/thank-you.html");
  } catch (err) {
    console.error("Error saving tour:", err);
    res.status(500).send("Error submitting form");
  }
});

// ---------- Forum Form Submission (accepts your current company field name) ----------
app.post("/submit-forum", async (req, res) => {
  try {
    // handle odd form name "Name of comppany"
    const companyName = req.body.companyName || req.body["Name of comppany"] || req.body.company;
    const { firstName, lastName, phone, address, country, email } = req.body;

    if (!firstName || !lastName || !companyName || !email) {
      return res.status(400).send("First Name, Last Name, Company and Email are required");
    }

    const doc = await Forum.create({ firstName, lastName, companyName, phone, address, country, email });

    // Confirmation to applicant
    try {
      await transporter.sendMail({
        from: `"CJB Website" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "CJB Business Forum Registration Received",
        html: `
          <h2>Dear ${firstName} ${lastName},</h2>
          <p>Thank you for registering for the CJB Business Forum. Company: <strong>${companyName}</strong>.</p>
        `
      });

      // Admin notification
      await transporter.sendMail({
        from: `"CJB Website" <${process.env.EMAIL_USER}>`,
        to: process.env.FORUM_EMAIL || process.env.ADMIN_EMAIL || process.env.CONTACT_EMAIL,
        subject: "📥 New Forum Registration",
        html: `
          <h2>New Forum Registration</h2>
          <p><strong>Name:</strong> ${firstName} ${lastName}</p>
          <p><strong>Company:</strong> ${companyName}</p>
          <p><strong>Phone:</strong> ${phone || "N/A"}</p>
          <p><strong>Address:</strong> ${address || "N/A"}</p>
          <p><strong>Country:</strong> ${country || "N/A"}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><em>Submitted at ${new Date().toLocaleString()}</em></p>
        `
      });
    } catch (mailErr) {
      console.error("Email error (forum):", mailErr);
    }

    res.redirect("/success.html");
  } catch (err) {
    console.error("Error saving forum:", err);
    res.status(500).send("Error submitting form");
  }
});

// ---------- Product Submission ----------
  app.post("/submit-product", upload.single("image"), (req, res) => {
  const filePath = path.join(__dirname, "data", "products.json");
  fs.readFile(filePath, "utf-8", (err, data) => {
    let products = [];
    if (!err && data) {
      products = JSON.parse(data);
    }

    const newProduct = {
      id: Date.now().toString(),
      name: req.body.name,
      category: req.body.category,
      price: req.body.price,
      description: req.body.description,
      image: req.file ? `/uploads/${req.file.filename}` : null,
    };

    products.push(newProduct);
    fs.writeFile(filePath, JSON.stringify(products, null, 2), (err) => {
      if (err) return res.status(500).json({ error: "Failed to save product" });
      res.redirect("/products.html");
    });
  });
});



// Get all approved products (no category filter)

app.get("/api/products", (req, res) => {
  fs.readFile(productsFile, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading products.json:", err);
      return res.status(500).json({ error: "Failed to read products" });
    }

    try {
      const products = JSON.parse(data);

      res.json(products);
      //const approvedProducts = products.filter(p => p.approved === true);
      //res.json(Products);
    } catch (parseErr) {
      console.error("Error parsing products.json:", parseErr);
      res.status(500).json({ error: "Invalid products data" });
    }
  });
});

// ---------- API Endpoint for Frontend ----------
app.get('/api/businesses/:category', (req, res) => {
  const category = req.params.category;
  const dataPath = path.join(__dirname, 'data', 'submissions.json');

  const businesses = fs.existsSync(dataPath)
    ? JSON.parse(fs.readFileSync(dataPath, 'utf-8')).filter(b => b.category === category)
    : [];

  res.json(businesses);
});

app.get("/api/products/:category", (req, res) => {
  const category = req.params.category;

  if (!fs.existsSync(productsFile)) {
    return res.json([]);
  }

  try {
    const products = JSON.parse(fs.readFileSync(productsFile, "utf-8"));
    const filtered = products.filter(p => p.category === category);
    res.json(filtered);
  } catch (err) {
    console.error("Error reading products by category:", err);
    res.status(500).json({ error: "Failed to filter products" });
  }
});

// ---------- Contact Form Submission (saves + sends email) ----------
app.post("/submit-contact", async (req, res) => {
  try {
    const { name, email, subject, message, phone } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).send("All fields are required.");
    }

    // Save to MongoDB
    const doc = await Contact.create({ name, email, subject, message, phone });

    // Confirmation to applicant
    try {
      await transporter.sendMail({
        from: `"CJB Website" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "We received your message",
        html: `
          <h2>Hi ${name},</h2>
          <p>Thanks for contacting CJB. We received your message about <strong>${subject}</strong> and will get back to you soon.</p>
        `
      });

      // Notification to admin
      await transporter.sendMail({
        from: `"CJB Website" <${process.env.EMAIL_USER}>`,
        to: process.env.CONTACT_EMAIL || process.env.ADMIN_EMAIL,
        subject: "📥 New Contact Submission",
        html: `
          <h2>New Contact Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || "N/A"}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong> ${message}</p>
          <p><em>Submitted at ${new Date().toLocaleString()}</em></p>
        `
      });
    } catch (mailErr) {
      console.error("Email error (contact):", mailErr);
      // still continue — the form was saved
    }

    // keep previous behavior: HTTP 200 text
    res.status(200).send("Message received successfully.");
  } catch (err) {
    console.error("Error saving contact:", err);
    res.status(500).send("Error submitting form");
  }
});

// ---------- Categories API ----------
app.get('/categories', (req, res) => {
  const categories = [
    "Agriculture",
    "Technology",
    "Fashion",
    "Food & Beverages",
    "Health",
    "Education",
    "Construction",
    "Entertainment",
    "Transportation",
    "Tourism"
  ];
  res.json(categories);
});

// ---------- Start Server ----------
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});