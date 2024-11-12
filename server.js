const express = require('express');
const blogData = require('./blog-service');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const exphbs = require('express-handlebars');
const path = require('path');

const app = express();
const HTTP_PORT = process.env.PORT || 8080;

cloudinary.config({
  cloud_name: 'do8toktki',
  api_key: '442976841246212',
  api_secret: 'h3Ivzcjr-NkacclHRFO3zULtOH0',
  secure: true
});

const upload = multer();

app.engine('.hbs', exphbs.engine({
  extname: '.hbs',
  defaultLayout: 'main',
  helpers: {
    navLink: function (url, options) {
      return `<li${(url == app.locals.activeRoute) ? ' class="active" ' : ''}><a href="${url}">${options.fn(this)}</a></li>`;
    },
    equal: function (lvalue, rvalue, options) {
      return (lvalue != rvalue) ? options.inverse(this) : options.fn(this);
    }
  }
}));
app.set('view engine', '.hbs');

app.use(express.static('public'));
app.use((req, res, next) => {
  let route = req.path.substring(1);
  app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

app.get('/', (req, res) => {
  res.redirect('/about');
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.get('/posts', (req, res) => {
  let queryPromise = null;
  if (req.query.category) {
    queryPromise = blogData.getPostsByCategory(req.query.category);
  } else {
    queryPromise = blogData.getAllPosts();
  }
  queryPromise
    .then(data => res.render('posts', { posts: data }))
    .catch(err => res.render('posts', { message: "No results" }));
});

app.get('/categories', (req, res) => {
  blogData.getCategories()
    .then(data => res.render('categories', { categories: data }))
    .catch(err => res.render('categories', { message: "No results" }));
});

app.get('/posts/add', (req, res) => {
  blogData.getCategories()
    .then(data => res.render('addPost', { categories: data }))
    .catch(err => res.render('addPost', { message: "No categories available" }));
});

app.post('/posts/add', upload.single('featureImage'), async (req, res) => {
  try {
    let imageUrl = '';
    if (req.file) {
      const streamUpload = (req) => {
        return new Promise((resolve, reject) => {
          let stream = cloudinary.uploader.upload_stream((error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          });
          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
      };
      const uploadResult = await streamUpload(req);
      imageUrl = uploadResult.url;
    }
    req.body.featureImage = imageUrl;
    await blogData.addPost(req.body);
    res.redirect('/posts');
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get('/blog/:id', (req, res) => {
  let viewData = {};

  blogData.getPostById(req.params.id)
    .then(post => {
      viewData.post = post; // Current post
      return blogData.getPublishedPosts(); // Get all published posts
    })
    .then(posts => {
      viewData.posts = posts.filter(p => p.id != req.params.id); // Exclude the current post
      res.render('blog', viewData);
    })
    .catch(err => {
      viewData.message = "No results";
      res.render('blog', viewData);
    });
});

app.get('/blog', (req, res) => {
  blogData.getPublishedPosts()
    .then(posts => res.render('blog', { posts }))
    .catch(err => res.render('blog', { message: "No results" }));
});

app.use((req, res) => {
  res.status(404).send("404 - Page Not Found");
});

blogData.initialize()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log(`Server listening on port ${HTTP_PORT}`);
    });
  })
  .catch(err => {
    console.log(err);
  });
