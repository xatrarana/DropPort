const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const gitRev = require('git-rev-sync');


const app = express();
const PORT = 3000;
const version = require('./package.json').version;
const repo = require('./package.json').repository.url;

// Set up the uploads directory
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});
const upload = multer({ storage });

// Set EJS as the template engine
app.set("view engine", "ejs");

// Middleware to serve static files
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));


// Routes

// Homepage - File Upload and List
app.get("/", (req, res) => {
  fs.readdir(UPLOAD_DIR, { withFileTypes: true }, (err, files) => {
    if (err) {
      return res.status(500).render("error", { message: "Unable to list files." ,version,repo});
    }
    const fileList = files.map((file) => ({
      name: file.name,
      isDirectory: file.isDirectory(),
    }));
    res.render("index", { files: fileList, version,repo });
  });
});

// File upload
app.post("/upload", upload.array("file",10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).render("error", { message: "No files were uploaded.", version,repo });
  }
  res.redirect("/");
});

// File download
app.get("/download/:filename", (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).render("error", { message: "File not found." , version,repo});
  }
  res.download(filePath);
});

// File delete
app.post("/delete/:filename", (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).render("error", { message: "File not found." });
  }
  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).render("error", { message: "Unable to delete the file." });
    }
    res.redirect("/");
  });
});

// Error handling
app.use((req, res) => {
  res.status(404).render("error", { message: "Page not found." });
});

// Start the server
app.listen(PORT, () => {
  console.log(`DropPort app running at http://localhost:${PORT}`);
});
