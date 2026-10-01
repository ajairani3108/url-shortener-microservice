require("dotenv").config();

const express = require("express");
const cors = require("cors");
const dns = require("dns");

const app = express();

const port = process.env.PORT || 3000;

app.use(cors());

// Parse form data
app.use(express.urlencoded({ extended: false }));

// Parse JSON data
app.use(express.json());

// Serve static files
app.use("/public", express.static(`${process.cwd()}/public`));

// Home page
app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Store shortened URLs
const urls = [];
let nextId = 1;

// POST: Create shortened URL
app.post("/api/shorturl", function (req, res) {
  const originalUrl = req.body.url;

  if (!originalUrl) {
    return res.json({ error: "invalid url" });
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(originalUrl);
  } catch (error) {
    return res.json({ error: "invalid url" });
  }

  // Only allow HTTP and HTTPS
  if (
    parsedUrl.protocol !== "http:" &&
    parsedUrl.protocol !== "https:"
  ) {
    return res.json({ error: "invalid url" });
  }

  // Check whether the hostname exists
  dns.lookup(parsedUrl.hostname, function (error) {
    if (error) {
      return res.json({ error: "invalid url" });
    }

    // Check if URL already exists
    const existing = urls.find(
      (item) => item.original_url === originalUrl
    );

    if (existing) {
      return res.json(existing);
    }

    // Create shortened URL
    const result = {
      original_url: originalUrl,
      short_url: nextId
    };

    urls.push(result);
    nextId++;

    res.json(result);
  });
});

// GET: Redirect shortened URL
app.get("/api/shorturl/:short_url", function (req, res) {
  const shortUrl = Number(req.params.short_url);

  const found = urls.find(
    (item) => item.short_url === shortUrl
  );

  if (!found) {
    return res.json({ error: "No short URL found" });
  }

  res.redirect(found.original_url);
});

// Start server
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});