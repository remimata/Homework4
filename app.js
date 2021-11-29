// Import

const express = require("express");
const pool = require("./database");
const cors = require("cors");
const fileUpload = require('express-fileupload');
const sassMiddleware = require("node-sass-middleware");

// Config

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(fileUpload());
app.use(
  sassMiddleware({
    src: __dirname + "/src/styles",
    dest: __dirname + "/public",
    debug: true,
  })
);

// -----------------Pages--------------------
app.get("/", async (req, res) => {
  try {
    console.log("get posts request has arrived");
    const posts = await pool.query("SELECT * FROM posts");
    res.render("posts", { posts: posts.rows });
  } catch (err) {
    console.error(err.message);
  }
});

app.get("/create", async (req, res) => {
  res.render("addnewpost");
});

// ----------------API-----------------------

app.get("/posts", async (req, res) => {
  try {
    console.log("get posts request has arrived");
    const posts = await pool.query(
      "SELECT id,photo_profile,image,description,likes,TO_CHAR(created_date:: DATE, 'dd-mm-yyyy') from posts"
    );
    res.json(posts.rows);
  } catch (err) {
    console.error(err.message);
  }
});

app.get("/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("get a post request has arrived");
    const posts = await pool.query("SELECT * FROM posts WHERE id = $1", [id]);
    res.json(posts.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

app.post("/posts/", async (req, res) => {
  console.log("post");
  try {
    // Moving File
    if (!req.files || Object.keys(req.files).length === 0) {
      var name = "";
    } else {
      var sampleFile = req.files.image;
      var name = sampleFile.name;
      var uploadPath = __dirname + "/public/assets/" + name;
      console.log(sampleFile,name,uploadPath);
      sampleFile.mv(uploadPath, function (err) {
        if (err) return res.status(500).send(err);
      });
    }
    // Update database
    const description = req.body.description;
    const created_date = new Date(Date.now()).toLocaleString();
    const photo_profile = "profile" + Math.round(Math.random() * 6)+".jpg";
    const newpost = await pool.query(
      "INSERT INTO posts(photo_profile, image, description, likes, created_date) values ($1, $2, $3, 0, $4) RETURNING*",
      [photo_profile, name, description, created_date]
    );
    res.redirect('/');
  } catch (err) {
    console.error(err.message);
  }
});

app.put("/likes/:id", async (req, res) => {
  try {
    console.log("likes updated !");
    const { id } = req.params;
    const likes = req.body.likes;
    const updatepost = await pool.query(
      "UPDATE posts SET likes = $2 WHERE id = $1",
      [id,likes]
    );
  } catch (err) {
    console.error(err.message);
  }
});


app.delete("/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("delete a post request has arrived");
    const deletepost = await pool.query("DELETE FROM posts WHERE id = $1", [
      id,
    ]);
  } catch (err) {
    console.error(err.message);
  }
});

//--------------------Error 404---------------
app.use((req, res) => {
  res.status(404).render("404");
});

app.listen(3000, () => {
  console.log("Server is listening to port 3000");
});
