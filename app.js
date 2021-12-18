const express = require('express');
const expressHbs = require('express-handlebars');
const hbs = require('hbs');
const path = require('path');
const fs = require('fs')
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const {response, res, request, req} = require('express');

let sessionUser = {};

const usersBase = path.join(__dirname, 'database/users.json');
const postsBase = path.join(__dirname, 'database/posts.json');
const jsonParser = express.json();

const port = 5000;
const app = express();

const imagesBase = multer.diskStorage({
    //Надо еще добавить проверку на является ли файл картинкой.
    destination: function (req, file, cb) {
        cb(null, __dirname + '/assets/images') //Здесь указывается путь для сохранения файлов
    },
    filename: function (req, file, cb) {
        let getFileExt = function (fileName) {
            let fileExt = fileName.split('.');
            if (fileExt.length === 1 || (fileExt[0] === "" && fileExt.length === 2)) {
                return '';
            }
            return fileExt.pop();
        }
        cb(null, Date.now() + '.' + getFileExt(file.originalname))
    }
});

const upload = multer({storage: imagesBase});

// app.use(express.static(__dirname +'/images'));
app.use(express.static(__dirname + '/assets'));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(session({secret: 'ololo', saveUninitialized: true, resave: true}));
app.set('views', __dirname + '/views');
app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + '/views/partials')

hbs.registerHelper("ifLogged", function () {

    if (sessionUser.name !== undefined) {
        return new hbs.SafeString('Welcome to the matrix       ,' + sessionUser.name)
    } else {
        return new hbs.SafeString('<button type="button" class="btn btn-outline-light me-2">' + '<a href="/sign-in">Login</a>' + '</button>' + '<button type="button" class="btn btn-warning"><a href="/reg-user">' + 'Register' + '</a></button>');

    }

});

app.post("/reg-user", jsonParser, function (request, response) {

    if (!request.body) return response.sendStatus(400);

    const userLogin = request.body.userLogin;
    const userMail = request.body.userMail;
    const userPass = request.body.userPass;
    let user = {name: userLogin, mail: userMail, pass: userPass};

    let data = fs.readFileSync(usersBase, 'utf8');
    let users = JSON.parse(data);

    // находим максимальный id
    const id = Math.max.apply(Math, users.map(function (o) {
        return o.id;
    }))
    // увеличиваем его на единицу
    user.id = id + 1;
    // добавляем пользователя в массив
    users.push(user);
    data = JSON.stringify(users);
    // перезаписываем файл с новыми данными
    fs.writeFileSync(usersBase, data);
    request.session.user = user;
    request.session.save();
    sessionUser = user;
    response.redirect('/');
    console.log(sessionUser)
});

app.post('/sign-in', (req, res) => {

    let data = fs.readFileSync(usersBase, 'utf8');
    data = JSON.parse(data);

    const user = data.find(user => user.name === req.body.userLogin)
    if (user == null) {
        return res.status(400).send('Cannot find user')
    }
    try {
        if ((req.body.userPass === user.pass)) {

            req.session.user = user;
            req.session.save();
            sessionUser = user;
            res.redirect(301, '/');
            console.log(req.session);
        } else {
            res.send('Not Allowed')
        }
    } catch {
        res.status(500).send()
    }
})

app.get('/user', (req, res) => {
    const sessionUser = req.session.user;
    return res.send(sessionUser);
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    sessionUser = {};
    return res.send('User logged out!');
})

app.get('/', function (request, response) {
    let posts = fs.readFileSync(postsBase, 'utf8');
    posts = JSON.parse(posts);

    let neededPosts;
    neededPosts = request.query.id;

    let tags = [];

    for (let i = 0; i < posts.length; i++) {
        let tag = posts[i].tags;
        tags.push(tag);
    }

    let neededTags = [];
    for (let subArray of tags) {
        for (let elem of subArray) {
            neededTags.push(elem);
        }
    }

    let result = neededTags.find(el => el === neededPosts)

    let foundContact = [];
    for (let i = 0; i < posts.length; i++) {
        let tag = posts[i].tags;
        let tager = tag.filter(es => es == result)
        if (tager.length > 0) {
            let searchedId = tager;
            foundContact.push(posts[i]);
        }
    }

    const pageCount = Math.ceil(posts.length / 3);
    let page = parseInt(request.query.page);
    if (!page) {
        page = 1;
    }
    if (page > pageCount) {
        page = pageCount
    }


    let pageNavLinks = [];

    let pageLinks = function () {
        for (let i = 0; i < pageCount; i++) {
            let link = 1;
            link += i;
            pageNavLinks.push(link)
        }
    };

    pageLinks();

    posts = posts.slice(page * 3 - 3, page * 3)

    if (request.query.id !== undefined) {
        response.render('home.hbs', {
            tagsPosts: foundContact
        })

    } else {
        response.render('home.hbs', {
            allPosts: posts,
            page: page,
            pageCount: pageNavLinks
        })
    }
});

app.get("/addPost", function (request, response) {
    if (sessionUser.name) {
        response.render('add_post.hbs');
    } else {
        response.render('sign-in.hbs');
    }
});

app.post('/addPost', jsonParser, upload.single('avatar'),

    function (request, response) {
        if (!request.body) return response.sendStatus(400);

        const postTitle = request.body.title;
        const postTags = request.body.tags;
        const postText = request.body.postText;
        const postId = Date.now();
        let postImage;

        const imageChecker = function () {
            if (request.file) {
                postImage = request.file.filename;
            }
        };
        imageChecker();

        const re = postTags.split(",");

        let newPost = {
            title: postTitle,
            text: postText,
            tags: re,
            author: sessionUser.name,
            image: postImage,
            id: postId
        };

        let data = fs.readFileSync(postsBase, 'utf8');
        let posts = JSON.parse(data);
        // добавляем пост в массив
        posts.push(newPost);
        data = JSON.stringify(posts);
        // перезаписываем файл постов
        fs.writeFileSync(postsBase, data);
        response.redirect('/');
    });

app.get('/allPosts', function (request, response) {
    let posts = fs.readFileSync(postsBase, 'utf8');
    response.send(posts)
});

app.get('/reg-user', function (req, res) {
    res.render('reg-user');
})

app.get('/sign-in', function (req, res) {
    res.render('sign-in.hbs');
})

app.get('/readPost/', function (req, res) {
    let posts = fs.readFileSync(postsBase, 'utf8');
    posts = JSON.parse(posts);

    let thisTitle;
    let thisPost;
    let thisTags;
    let thisImage;

    let neededId = req.query.id;

    let a = function filterById(arr, id) {
        return arr.filter(function (item) {
            if (item.id == neededId) {
                thisPost = item.text;
                thisTags = item.tags;
                thisTitle = item.title;
                thisImage = item.image;
            }
        })
    };

    a(posts, neededId);

    res.render('full-post', {
        postTitle: thisTitle,
        postText: thisPost,
        postImage: thisImage,
        postTags: thisTags
    });
});

app.listen(port, () => {
    console.log('Server started')
});
