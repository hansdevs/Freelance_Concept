const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const sqlite3 = require("sqlite3").verbose();
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const fs = require("fs");

const dbFile = path.join(__dirname, "data", "database.db"); // Adjust if you want DB in a "data" folder
const db = new sqlite3.Database(dbFile);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    displayName TEXT,
    email TEXT,
    phone TEXT,
    location TEXT,
    zip TEXT,
    website TEXT,
    description TEXT,
    pic TEXT,
    darkModeEnabled INTEGER DEFAULT 0
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    category TEXT,
    location TEXT,
    zipCode TEXT,
    type TEXT,
    price TEXT,
    company TEXT,
    phone TEXT,
    email TEXT,
    contact TEXT,
    logo TEXT,
    description TEXT,
    likes INTEGER DEFAULT 0,
    createdAt INTEGER
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS microjobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    shortDesc TEXT,
    price TEXT
  )`);
});

const app = express();

app.use(express.json({ limit: "5mb" }));
app.use(session({
  secret: "super-secret-session",
  resave: false,
  saveUninitialized: false,
  store: new SQLiteStore({ db: "sessions.db", dir: path.join(__dirname, "data") }),
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 }
}));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public"), {
  setHeaders: (res, filePath) => {
    if (path.extname(filePath).toLowerCase() === ".heic") {
      res.setHeader("Content-Type", "image/heic");
    }
  }
}));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/index.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/create-listing.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "create-listing.html"));
});

app.get("/detail.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "detail.html"));
});

// -- AUTH ROUTES --
app.post("/api/auth/register", (req, res) => {
  let { username, password, displayName, email, phone, location, zip, website, description, pic } = req.body;
  if (!username || !password) {
    return res.json({ success: false, message: "Missing username or password." });
  }
  bcrypt.hash(password, 10, (err, hashed) => {
    if (err) return res.json({ success: false, message: "Error hashing password." });
    db.run(
      "INSERT INTO users (username, password, displayName, email, phone, location, zip, website, description, pic) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [username, hashed, displayName || "", email || "", phone || "", location || "", zip || "", website || "", description || "", pic || ""],
      function(e) {
        if (e) return res.json({ success: false, message: "Username already exists or error saving user." });
        req.session.userId = this.lastID;
        res.json({ success: true });
      }
    );
  });
});

app.post("/api/auth/login", (req, res) => {
  let { username, password } = req.body;
  if (!username || !password) {
    return res.json({ success: false, message: "Missing username or password." });
  }
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
    if (err || !row) {
      return res.json({ success: false, message: "Invalid credentials." });
    }
    bcrypt.compare(password, row.password, (er, same) => {
      if (er || !same) {
        return res.json({ success: false, message: "Invalid credentials." });
      }
      req.session.userId = row.id;
      res.json({ success: true });
    });
  });
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.post("/api/auth/update", (req, res) => {
  if (!req.session.userId) return res.json({ success: false, message: "Not authenticated." });
  let { displayName, email, phone, location, zip, website, description, pic } = req.body;
  db.run(
    "UPDATE users SET displayName=?, email=?, phone=?, location=?, zip=?, website=?, description=?, pic=? WHERE id=?",
    [displayName || "", email || "", phone || "", location || "", zip || "", website || "", description || "", pic || "", req.session.userId],
    function(e) {
      if (e) return res.json({ success: false, message: "Error updating profile." });
      res.json({ success: true });
    }
  );
});

app.get("/api/auth/me", (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  db.get("SELECT * FROM users WHERE id=?", [req.session.userId], (err, row) => {
    if (err || !row) return res.json({ user: null });
    res.json({
      user: {
        id: row.id,
        username: row.username,
        displayName: row.displayName,
        email: row.email,
        phone: row.phone,
        location: row.location,
        zip: row.zip,
        website: row.website,
        description: row.description,
        pic: row.pic
      }
    });
  });
});

app.get("/api/auth/status", (req, res) => {
  if (!req.session.userId) return res.json({ authenticated: false });
  res.json({ authenticated: true, user: req.session.userId });
});

// -- LISTINGS ROUTES --
app.post("/api/listings", (req, res) => {
  if (!req.session.userId) return res.json({ success: false, message: "Not authenticated." });
  let {
    title, category, location, zipCode, type,
    price, company, phone, email, contact, logo,
    description
  } = req.body;
  let createdAt = Date.now();
  db.run(
    `INSERT INTO listings (title, category, location, zipCode, type, price, company, phone, email, contact, logo, description, createdAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [title, category, location, zipCode, type, price, company, phone, email, contact, logo, description, createdAt],
    function(e) {
      if (e) return res.json({ success: false, message: "Error creating listing." });
      res.json({ success: true });
    }
  );
});

app.get("/api/listings", (req, res) => {
  db.all("SELECT * FROM listings ORDER BY createdAt DESC", [], (err, rows) => {
    if (err) return res.json([]);
    res.json(rows);
  });
});

app.get("/api/listings/:id", (req, res) => {
  let id = parseInt(req.params.id, 10);
  db.get("SELECT * FROM listings WHERE id=?", [id], (err, row) => {
    if (err || !row) return res.json({});
    res.json(row);
  });
});

app.post("/api/listings/:id/like", (req, res) => {
  if (!req.session.userId) return res.json({ success: false, message: "Not authenticated." });
  let id = parseInt(req.params.id, 10);
  db.get("SELECT * FROM listings WHERE id=?", [id], (err, row) => {
    if (err || !row) return res.json({ success: false, message: "Listing not found." });
    let newLikes = (row.likes || 0) + 1;
    db.run("UPDATE listings SET likes=? WHERE id=?", [newLikes, id], e => {
      if (e) return res.json({ success: false, message: "Failed to like listing." });
      res.json({ success: true, likes: newLikes });
    });
  });
});

// -- SEARCH & MISC ROUTES --
app.get("/api/search", (req, res) => {
  let type = req.query.type || "jobs";
  let q = req.query.q || "";
  let z = req.query.zip || "";
  if (type === "jobs") {
    db.all(
      "SELECT * FROM listings WHERE (title LIKE ? OR location LIKE ? OR company LIKE ?) AND (zipCode LIKE ?) ORDER BY createdAt DESC",
      [`%${q}%`, `%${q}%`, `%${q}%`, `%${z}%`],
      (err, rows) => {
        if (err) return res.json([]);
        res.json(rows);
      }
    );
  } else {
    db.all(
      "SELECT * FROM users WHERE (username LIKE ? OR displayName LIKE ? OR location LIKE ?) AND (zip LIKE ?) ORDER BY id DESC",
      [`%${q}%`, `%${q}%`, `%${q}%`, `%${z}%`],
      (err, rows) => {
        if (err) return res.json([]);
        let mapped = rows.map(r => {
          return {
            username: r.username,
            displayName: r.displayName,
            email: r.email,
            phone: r.phone,
            location: r.location,
            zip: r.zip,
            website: r.website,
            description: r.description,
            pic: r.pic
          };
        });
        res.json(mapped);
      }
    );
  }
});

app.post("/api/darkmode", (req, res) => {
  if (!req.session.userId) return res.json({ success: false });
  let enabled = req.body.enabled ? 1 : 0;
  db.run("UPDATE users SET darkModeEnabled=? WHERE id=?", [enabled, req.session.userId], e => {
    if (e) return res.json({ success: false });
    res.json({ success: true });
  });
});

app.get("/api/darkmode", (req, res) => {
  if (!req.session.userId) return res.json({ enabled: false });
  db.get("SELECT darkModeEnabled FROM users WHERE id=?", [req.session.userId], (err, row) => {
    if (err || !row) return res.json({ enabled: false });
    res.json({ enabled: !!row.darkModeEnabled });
  });
});

app.get("/api/recommendations", (req, res) => {
  if (!req.session.userId) return res.json([]);
  db.all("SELECT * FROM listings ORDER BY RANDOM() LIMIT 3", [], (err, rows) => {
    if (err) return res.json([]);
    res.json(rows);
  });
});

app.get("/api/microjobs", (req, res) => {
  db.all("SELECT * FROM microjobs ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.json([]);
    res.json(rows);
  });
});

app.post("/api/ai-proposal", (req, res) => {
  if (!req.session.userId) return res.json({ proposal: "Not authenticated." });
  let { listingTitle, listingDesc } = req.body;
  let fakeAIProposal = `Proposal for "${listingTitle}" based on description: ${listingDesc}`;
  res.json({ proposal: fakeAIProposal });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log("Server running on http://localhost:" + PORT);
});
