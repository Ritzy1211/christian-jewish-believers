require('dotenv').config();
console.log("Environment variables loaded:");
console.log("PORT:", process.env.PORT);
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("ADMIN_EMAIL:", process.env.ADMIN_EMAIL);
console.log("CONTACT_EMAIL:", process.env.CONTACT_EMAIL);
console.log("SCHOOL_EMAIL:", process.env.SCHOOL_EMAIL);
console.log("TOUR_EMAIL:", process.env.TOUR_EMAIL);
console.log("BUSINESS_EMAIL:", process.env.BUSINESS_EMAIL);
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

// ===================================================================
//                         ROUTES
// ===================================================================

// ---------- Marketplace Registration ----------
app.post('/submit-marketplace', async (req, res) => {
  const { businessName, ownerName, country, email, category, description } = req.body;

  if (!businessName || !ownerName || !country || !email || !category || !description) {
    return res.status(400).send('Missing required fields.');
  }

  const dataPath = path.join(__dirname, 'data', 'submissions.json');
  const submissions = fs.existsSync(dataPath)
    ? JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
    : [];

  const submission = {
    businessName,
    ownerName,
    country,
    email,
    category,
    description,
    submittedAt: new Date().toISOString()
  };

  submissions.push(submission);
  fs.writeFileSync(dataPath, JSON.stringify(submissions, null, 2));

  // Emails
  try {
    // Confirmation to registrant
    await transporter.sendMail({
      from: `"Christian Jewish Believers" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Marketplace Registration Received',
      html: `
        <h2>Thank you, ${ownerName}!</h2>
        <p>We’ve received your business registration for <strong>${businessName}</strong>.</p>
        <p>Category: ${category}</p>
        <p>We'll get in touch soon. God bless you!</p>
      `
    });

    // Notification to admin
    await transporter.sendMail({
      from: `"CJB Website" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.CONTACT_EMAIL,
      subject: '📥 New Marketplace Registration',
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
  } catch (err) {
    console.error('Email error (marketplace):', err);
  }

  res.redirect('/success.html');
});

// ---------- Membership Registration ----------
app.post('/submit-membership', async (req, res) => {
  const { firstName, lastName, title, phone, address, country, email, christian, business, garments } = req.body;

  if (!firstName || !lastName || !email || !country) {
    return res.status(400).send('Missing required fields.');
  }

  const dataPath = path.join(__dirname, 'data', 'members.json');
  const members = fs.existsSync(dataPath)
    ? JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
    : [];

  const member = {
    firstName,
    lastName,
    title,
    phone,
    address,
    country,
    email,
    christian,
    business,
    garments,
    submittedAt: new Date().toISOString()
  };

  members.push(member);
  fs.writeFileSync(dataPath, JSON.stringify(members, null, 2));

  // Emails
  try {
    // Confirmation to member
    await transporter.sendMail({
      from: `"Christian Jewish Believers" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Membership Registration Received',
      html: `
        <h2>Dear ${firstName},</h2>
        <p>Your membership application has been received. Thank you!</p>
        <p>We will contact you shortly. God bless you.</p>
      `
    });

    // Notification to admin
    await transporter.sendMail({
      from: `"CJB Website" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.CONTACT_EMAIL,
      subject: '📥 New Membership Application Received',
      html: `
        <h2>New Membership Application</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Title:</strong> ${title || 'N/A'}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
        <p><strong>Address:</strong> ${address || 'N/A'}</p>
        <p><strong>Country:</strong> ${country || 'N/A'}</p>
        <p><strong>Christian:</strong> ${christian || 'N/A'}</p>
        <p><strong>Business:</strong> ${business || 'N/A'}</p>
        <p><strong>Preferred Garments:</strong> ${garments || 'N/A'}</p>
        <p><em>Submitted at ${new Date().toLocaleString()}</em></p>
      `
    });
  } catch (err) {
    console.error('Email error (membership):', err);
  }

  res.redirect('/success.html');
});

// ---------- Membership Submission Alternate Route ----------
app.post('/submit-membership-alt', (req, res) => {
  const {
    firstName,
    lastName,
    title,
    phone,
    address,
    country,
    email,
    isChristian,
    intoBusiness,
    preferredGarment
  } = req.body;

  const newMember = {
    firstName,
    lastName,
    title,
    phone,
    address,
    country,
    email,
    isChristian,
    intoBusiness,
    preferredGarment,
    date: new Date().toISOString()
  };

  const filePath = path.join(__dirname, 'data', 'memberships.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    let memberships = [];
    if (!err && data) {
      try {
        memberships = JSON.parse(data);
      } catch {
        memberships = [];
      }
    }
    memberships.push(newMember);

    fs.writeFile(filePath, JSON.stringify(memberships, null, 2), (err2) => {
      if (err2) {
        return res.json({ success: false, message: "Failed to save membership." });
      }
      res.json({ success: true, message: "Membership submitted successfully!" });
    });
  });
});


// ---------- School of Eschatology Form Submission ----------
app.post("/submit-school", async (req, res) => {
  try {
    // DEBUG: log the form data to console
    console.log("School form submission received:", req.body);

    // Destructure submitted fields
    const { firstName, lastName, title, phone, address, country, email } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !title || !phone || !address || !country || !email) {
      return res.status(400).send("All fields are required. Please fill out the form completely.");
    }

    // Save submission to file
    const filePath = path.join(__dirname, "data", "school.json");
    let submissions = [];

    if (fs.existsSync(filePath)) {
      try {
        submissions = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      } catch {
        submissions = [];
      }
    }

    const submission = {
      firstName,
      lastName,
      title,
      phone,
      address,
      country,
      email,
      submittedAt: new Date().toISOString()
    };

    submissions.push(submission);
    fs.writeFileSync(filePath, JSON.stringify(submissions, null, 2));

    // ---------- Email Sending ----------
    // 1) Confirmation to applicant
    await transporter.sendMail({
      from: `"Christian Jewish Believers" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "School of Eschatology Registration Received",
      html: `
        <h2>Dear ${title} ${firstName} ${lastName},</h2>
        <p>Thank you for registering with the Messianic School of Eschatology & Jewish Root.</p>
        <p>We will contact you shortly with next steps. God bless you!</p>
      `
    });

    // 2) Notification to admin
    await transporter.sendMail({
      from: `"CJB Website" <${process.env.EMAIL_USER}>`,
      to: process.env.SCHOOL_EMAIL || process.env.ADMIN_EMAIL || process.env.CONTACT_EMAIL,
      subject: "📥 New School of Eschatology Registration",
      html: `
        <h2>New School Registration</h2>
        <p><strong>Name:</strong> ${title} ${firstName} ${lastName}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Address:</strong> ${address}</p>
        <p><strong>Country:</strong> ${country}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><em>Submitted at ${new Date().toLocaleString()}</em></p>
      `
    });

    // Redirect to success page
    res.redirect("/success.html");
  } catch (err) {
    console.error("Error in /submit-school:", err);
    res.status(500).send("An error occurred while submitting the form. Please try again.");
  }
});


// ---------- Tour Form Submission (applicant + admin emails) ----------
app.post("/submit-tour", async (req, res) => {
  const { firstName, lastName, title, phone, address, country, email, destination, dates } = req.body;

  // Validate required fields
  if (!firstName || !lastName || !email || !destination) {
    return res.status(400).send("First Name, Last Name, Email and Destination are required");
  }

  // Save
  const submission = {
    firstName, lastName, title, phone, address, country, email, destination, dates,
    submittedAt: new Date().toISOString()
  };
  const filePath = path.join(__dirname, "data", "tours.json");
  let submissions = [];
  if (fs.existsSync(filePath)) {
    try { submissions = JSON.parse(fs.readFileSync(filePath)); } catch { submissions = []; }
  }
  submissions.push(submission);
  fs.writeFileSync(filePath, JSON.stringify(submissions, null, 2));

  try {
    // 1) Confirmation to applicant
    await transporter.sendMail({
      from: `"Christian Jewish Believers" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Tour Registration Received",
      html: `
        <h2>Dear ${title ? title + " " : ""}${firstName} ${lastName},</h2>
        <p>Thank you for registering for the tour.</p>
        <p><strong>Destination:</strong> ${destination || "N/A"}<br/>
           <strong>Preferred Dates:</strong> ${dates || "N/A"}</p>
        <p>We will contact you shortly. God bless you.</p>
      `
    });

    // 2) Notification to admin
    await transporter.sendMail({
      from: `"CJB Website" <${process.env.EMAIL_USER}>`,
      to: process.env.TOUR_EMAIL || process.env.ADMIN_EMAIL || process.env.CONTACT_EMAIL,
      subject: "📥 New Tour Registration",
      html: `
        <h2>New Tour Registration</h2>
        <p><strong>Name:</strong> ${title ? title + " " : ""}${firstName} ${lastName}</p>
        <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
        <p><strong>Address:</strong> ${address || 'N/A'}</p>
        <p><strong>Country:</strong> ${country || 'N/A'}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Destination:</strong> ${destination}</p>
        <p><strong>Preferred Dates:</strong> ${dates || 'N/A'}</p>
        <p><em>Submitted at ${new Date().toLocaleString()}</em></p>
      `
    });

    // Redirect (make sure /public/success.html exists)
    res.redirect("/thank-you.html");
  } catch (err) {
    console.error("Email error (tour):", err);
    res.status(500).send("Error submitting form");
  }
});

// ---------- Forum Form Submission (accepts your current company field name) ----------
app.post("/submit-forum", async (req, res) => {
  // Normalize the company field to handle your current form name "Name of comppany"
  const companyName = req.body.companyName || req.body["Name of comppany"] || req.body.company;
  const { firstName, lastName, phone, address, country, email } = req.body;

  if (!firstName || !lastName || !companyName || !email) {
    return res.status(400).send("First Name, Last Name, Company Name, and Email are required");
  }

  // Save
  const submission = {
    firstName, lastName, companyName, phone, address, country, email,
    submittedAt: new Date().toISOString()
  };
  const filePath = path.join(__dirname, "data", "forum.json");
  let submissions = [];
  if (fs.existsSync(filePath)) {
    try { submissions = JSON.parse(fs.readFileSync(filePath)); } catch { submissions = []; }
  }
  submissions.push(submission);
  fs.writeFileSync(filePath, JSON.stringify(submissions, null, 2));

  try {
    // 1) Confirmation to applicant
    await transporter.sendMail({
      from: `"Christian Jewish Believers" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "CJB Business Forum Registration Received",
      html: `
        <h2>Dear ${firstName} ${lastName},</h2>
        <p>Thank you for registering for the CJB Business Forum.</p>
        <p><strong>Company:</strong> ${companyName}</p>
        <p>We will follow up with details shortly. God bless you.</p>
      `
    });

    // 2) Notification to admin
    await transporter.sendMail({
      from: `"CJB Website" <${process.env.EMAIL_USER}>`,
      to: process.env.FORUM_EMAIL || process.env.ADMIN_EMAIL || process.env.CONTACT_EMAIL,
      subject: "📥 New Forum Registration",
      html: `
        <h2>New Forum Registration</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Company:</strong> ${companyName}</p>
        <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
        <p><strong>Address:</strong> ${address || 'N/A'}</p>
        <p><strong>Country:</strong> ${country || 'N/A'}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><em>Submitted at ${new Date().toLocaleString()}</em></p>
      `
    });

    res.redirect("/success.html");
  } catch (err) {
    console.error("Email error (forum):", err);
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
app.post('/submit-contact', async (req, res) => {
  const { name, email, subject, message, phone } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).send('All fields are required.');
  }

  const contactFilePath = path.join(__dirname, 'contacts.json');

  let contacts = [];
  if (fs.existsSync(contactFilePath)) {
    try {
      contacts = JSON.parse(fs.readFileSync(contactFilePath));
    } catch {
      contacts = [];
    }
  }

  contacts.push({
    name,
    email,
    subject,
    message,
    phone: phone || null,
    date: new Date().toISOString()
  });

  fs.writeFileSync(contactFilePath, JSON.stringify(contacts, null, 2));

  try {
    await transporter.sendMail({
      from: `"CJB Website" <${process.env.EMAIL_USER}>`,
      to: process.env.CONTACT_EMAIL || process.env.ADMIN_EMAIL,
      subject: '📥 New Contact Information Received',
      html: `
        <h2>New Contact Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
        <p><strong>Message:</strong> ${message}</p>
        <p><em>Submitted at ${new Date().toLocaleString()}</em></p>
      `
    });
  } catch (err) {
    console.error('Email error (contact):', err);
    // continue; user still gets success if saving worked
  }

  res.status(200).send('Message received successfully.');
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