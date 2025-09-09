const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const postsFile = path.join(__dirname, "posts.json");

// --- Password setup ---
const PASSWORD_HASH_FILE = path.join(__dirname, "password.hash");

// Initialize password hash if missing
if (!fs.existsSync(PASSWORD_HASH_FILE)) {
  if (!process.env.UPLOAD_PASSWORD) {
    console.error("Error: No UPLOAD_PASSWORD set in environment.");
    process.exit(1);
  }
  const hash = bcrypt.hashSync(process.env.UPLOAD_PASSWORD, 10);
  fs.writeFileSync(PASSWORD_HASH_FILE, hash);
}
const storedHash = fs.readFileSync(PASSWORD_HASH_FILE, "utf-8");

// --- Posts storage ---
function loadPosts() {
  if (!fs.existsSync(postsFile)) {
    fs.writeFileSync(postsFile, JSON.stringify([]));
  }
  return JSON.parse(fs.readFileSync(postsFile, "utf-8"));
}

function savePosts(posts) {
  fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2));
}

// --- content parser ---
function parseContent(raw) {
  return raw.replace(/\[content\](.*?)\[\/content\]/g, (match, url) => {
    if (url.match(/\.(jpeg|jpg|png|gif|webp)$/i)) {
      return `<img src="${url}" class="media-img" alt="embedded image"/>`;
    } else if (url.match(/\.(mp4|webm|ogg)$/i)) {
      return `<video controls class="media-video"><source src="${url}"></video>`;
    } else if (url.match(/\.(mp3|wav|ogg)$/i)) {
      return `<audio controls class="media-audio"><source src="${url}"></audio>`;
    } else {
      return `<a href="${url}" target="_blank">${url}</a>`;
    }
  });
}

// Routes
app.get("/", (req, res) => res.render("index"));

app.get("/blog", (req, res) => {
  const posts = loadPosts().map((p) => ({
    ...p,
    parsedContent: parseContent(p.content),
  }));
  res.render("blog", { title: "My Blog", posts });
});

// Partial route for AJAX reload
app.get("/blog/partial", (req, res) => {
  const posts = loadPosts().map((p) => ({
    ...p,
    parsedContent: parseContent(p.content),
  }));
  res.render("partials/blogContent", { posts });
});

app.get("/upload", (req, res) => {
  res.render("upload", { title: "Upload a Post", error: null });
});

app.post("/upload", async (req, res) => {
  const { title, content, password } = req.body;

  if (!password || !(await bcrypt.compare(password, storedHash))) {
    return res.status(401).render("upload", {
      title: "Upload a Post",
      error: "Invalid password. Access denied.",
    });
  }

  if (title && content) {
    const posts = loadPosts();
    posts.push({ title, content, date: new Date().toISOString() });
    savePosts(posts);
  }

  res.redirect("/blog");
});

app.listen(PORT, () => {
  console.log(`Secure blog running at http://localhost:${PORT}`);
});
