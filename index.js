const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Serve static files from /public
app.use("/public", express.static(path.join(__dirname, "public")));

// Set the view engine to EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Route for /view
app.get("/", (req, res) => {
  res.render("index");
});

app.listen(PORT, () => {
  console.log(`Pilla.js loaded at http://localhost:${PORT}`);
});
