const express = require('express');
const expressHbs = require('express-handlebars');
const hbs = require('hbs');
const path = require('path');
const fs = require('fs')
const bodyParser = require('body-parser');
// const saveUser = require('./reg_controller');
const session = require("express-session");
const cookieParser = require("cookie-parser");
const multer = require('multer');
const {response} = require("express");

     // const authRoute = require('./routes/register.js');

let sessionUser = {};

const usersBase = path.join(__dirname, 'Api/users.json');
const postsBase = path.join(__dirname, 'Api/posts.json');
const jsonParser = express.json();

const port = 5000;

const app = express();

const front = path.join(__dirname, 'views');



const imagesBase = multer.diskStorage({

    //Надо еще добавить проверку на является ли файл картинкой.
    destination: function (req, file, cb) {
        cb(null, __dirname + '/Api/images/') //Здесь указывается путь для сохранения файлов
    },
    filename: function (req, file, cb) {
        let getFileExt = function(fileName){
            let fileExt = fileName.split(".");
            if( fileExt.length === 1 || ( fileExt[0] === "" && fileExt.length === 2 ) ) {
                return "";
            }
            return fileExt.pop();
        }
        cb(null, Date.now() + '.' + getFileExt(file.originalname))
    }
});

 const upload = multer({ storage: imagesBase });



//app.use(express.static(front));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({ secret: "ololo", saveUninitialized: true, resave: true }));
app.set('views', __dirname + '/views');
app.set("view engine", "hbs");
//app.set("views", "templates");
hbs.registerPartials(__dirname + '/views/partials')
// app.engine('html', require('hbs').__express);




app.post("/reg-user", jsonParser, function (request, response) {



    if(!request.body) return response.sendStatus(400);

    const userLogin = request.body.userLogin;
    const userMail = request.body.userMail;
    const userPass = request.body.userPass;
    let user = {name: userLogin, mail: userMail, pass:userPass};


    let data = fs.readFileSync(usersBase,"utf8");
    let users = JSON.parse(data);

    // находим максимальный id
    const id = Math.max.apply(Math,users.map(function(o){return o.id;}))
    // увеличиваем его на единицу
    user.id = id+1;
    // добавляем пользователя в массив
    users.push(user);
    data = JSON.stringify(users);
    // перезаписываем файл с новыми данными
    fs.writeFileSync(usersBase, data);
    response.send(user);

});

app.post('/sign-in',  (req, res) => {

    let data = fs.readFileSync(usersBase,"utf8");
     data = JSON.parse(data);

    const user = data.find(user => user.name === req.body.userLogin)
    if (user == null) {
        return res.status(400).send('Cannot find user')
    }
    try {
        if( (req.body.userPass === user.pass)) {

            req.session.user = user;
            req.session.save();
            sessionUser = user;
            res.send('Success')
             console.log(req.session);
        } else {
            res.send('Not Allowed')
        }
    } catch {
        res.status(500).send()
    }
})

app.get("/user", (req, res) => {
    const sessionUser = req.session.user;
    return res.send(sessionUser);
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    return res.send("User logged out!");
});


app.get("/", function(request, response){
    response.render('home.hbs');
    console.log(app)
});

app.get("/addPost", function(request, response){
    if (sessionUser.id > 0) {
        response.sendFile(__dirname + "/views/add_post.html");
        console.log(sessionUser)
    }
    else {
        response.end('FUCK YOU');
        console.log(sessionUser)
    }
});

app.post("/addPost", jsonParser, upload.single('avatar') ,

    function (request, response) {
        // console.log(JSON.stringify(request.file.path))
    if(!request.body) return response.sendStatus(400);

    const postTitle = request.body.title;
    const postTags = request.body.tags;
    const postText = request.body.postText;
    const postId = Date.now();

    let comma = ',';

        function splitString(stringToSplit, separator) {
            let arrayOfStrings = stringToSplit.split(separator);
        }

        splitString(postTags, comma);

        let newPost = {title: postTitle, text: postText, tags: postTags, author: sessionUser.name, image: request.file.path, id: postId  };

    let data = fs.readFileSync(postsBase,"utf8");
    let posts = JSON.parse(data);

    // добавляем пост в массив
    posts.push(newPost);
    data = JSON.stringify(posts);
    // перезаписываем файл постов
    fs.writeFileSync(postsBase, data);
    response.send(newPost);

});

app.get("/allPosts", function(request, response){
    let posts = fs.readFileSync(postsBase,"utf8");
    response.send(posts)
});

app.get("/reg-user", function (req, res) {
    res.render('reg-user.hbs');
})


app.listen(port, ()=> {
    console.log('Server started')
    console.log(sessionUser)
});