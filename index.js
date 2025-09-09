const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const postsFile = path.join(__dirname, "posts.json");

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

app.get("/upload", (req, res) => {
  res.render("upload", { title: "Upload a Post" });
});

app.post("/upload", (req, res) => {
  const { title, content } = req.body;
  if (title && content) {
    const posts = loadPosts();
    posts.push({ title, content, date: new Date().toISOString() });
    savePosts(posts);
  }
  res.redirect("/blog");
});

app.listen(PORT, () => {
  console.log(`Pilla.js loaded at http://localhost:${PORT}`);
});
