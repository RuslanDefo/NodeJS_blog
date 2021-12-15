const express = require('express');
const expressHbs = require('express-handlebars');
const hbs = require('hbs');
const path = require('path');
const fs = require('fs')
const bodyParser = require('body-parser');
const session = require("express-session");
const cookieParser = require("cookie-parser");
const multer = require('multer');
 const {response, res, request, req} = require("express");

let sessionUser = {};

SESS_NAME = sessionUser;

const usersBase = path.join(__dirname, 'Api/users.json');
const postsBase = path.join(__dirname, 'Api/posts.json');
const jsonParser = express.json();

const port = 5000;

const app = express();

const front = path.join(__dirname, 'views');



const imagesBase = multer.diskStorage({

    //Надо еще добавить проверку на является ли файл картинкой.
    destination: function (req, file, cb) {
        cb(null, __dirname + '/assets/images') //Здесь указывается путь для сохранения файлов
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


 // app.use(express.static(__dirname +'/images'));
app.use(express.static(__dirname +'/assets'));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({ secret: "ololo", saveUninitialized: true, resave: true }));
app.set('views', __dirname + '/views');
app.set("view engine", "hbs");
hbs.registerPartials(__dirname + '/views/partials')

hbs.registerHelper("ifLogged", function(user){

    if (sessionUser.name !== undefined) {
        return new hbs.SafeString('Welcome to the matrix       ,' + sessionUser.name)
    } else {
        return new hbs.SafeString('<button type="button" class="btn btn-outline-light me-2">'+'<a href="/sign-in">Login</a>'+'</button>'+'<button type="button" class="btn btn-warning"><a href="/reg-user">'+'Register'+'</a></button>');

    }

});


hbs.registerHelper('pagination', function(currentPage, totalPage, size, options) {
    let startPage, endPage, context;

    if (arguments.length === 3) {
        options = size;
        size = 5;
    }

    startPage = currentPage - Math.floor(size / 2);
    endPage = currentPage + Math.floor(size / 2);

    if (startPage <= 0) {
        endPage -= (startPage - 1);
        startPage = 1;
    }

    if (endPage > totalPage) {
        endPage = totalPage;
        if (endPage - size + 1 > 0) {
            startPage = endPage - size + 1;
        } else {
            startPage = 1;
        }
    }

    context = {
        startFromFirstPage: false,
        pages: [],
        endAtLastPage: false,
    };
    if (startPage === 1) {
        context.startFromFirstPage = true;
    }
    for (let i = startPage; i <= endPage; i++) {
        context.pages.push({
            page: i,
            isCurrent: i === currentPage,
        });
    }
    if (endPage === totalPage) {
        context.endAtLastPage = true;
    }

    return options.fn(context);
});


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
    request.session.user = user;
    request.session.save();
    sessionUser = user;
    response.redirect('/');
    console.log(sessionUser)
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
            res.redirect(301, '/');
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
    sessionUser = {};
    return res.send("User logged out!");
    console.log(sessionUser)
})


app.get("/", function(request, response){
      let posts = fs.readFileSync(postsBase,"utf8");
      posts = JSON.parse(posts);
       let totalCards =  new Array(Object.values(posts));

      //console.log(posts)
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

let tagsPosts = [];
let foundContact = [];
    for (let i = 0; i < posts.length; i++) {
        let tag = posts[i].tags;
        let tager = tag.filter(es => es == result)
        console.log('TAGER===' + tager)
       if (tager.length > 0 ) {
          let searchedId = tager;
           console.log('SEARCHED===' + searchedId)
           foundContact.push(posts[i]);
         // tagsPosts.push(searchedId);
       }
    };

    console.log('EHEEEY ==' + JSON.stringify(foundContact))


    // const findItemNested = (arr, itemId, nestingKey) => (
    //     arr.reduce((a, item) => {
    //         if (a) return a;
    //         if (item == itemId) return item;
    //         if (item[nestingKey]) {
    //
    //             console.log(item[nestingKey])
    //             return findItemNested(item[nestingKey], itemId, nestingKey)
    //
    //         }
    //     }, null)
    // );
    //
    //
    // const res = findItemNested(posts, tagsPosts, "tags");
    // console.log('SSSSSSSSSSS' + res);

    // function findByIdRecursive(array, tags) {
    //     for (let index = 0; index < array.length; index++) {
    //         const element = array[index];
    //         if (element.tags == tags) {
    //             return element;
    //         } else {
    //             if (element.children) {
    //                 const found = findByIdRecursive(element.children, tags);
    //
    //                 if (found) {
    //                     return found;
    //                     console.log('FOUND ++' + found)
    //                 }
    //             }
    //         }
    //     }
    // }
    //
    // findByIdRecursive(posts, tagsPosts);

  // const filteredPosts = posts.slice().filter(item => item.tags == tagsPosts);

  // console.log('This posts NEEDE==' + JSON.stringify(filteredPosts))

    //console.log('This posts ==' + tagsPosts)
    // function reducer(acc, value) {
    //     if (value.seriesNumber === 2) {
    //         acc.push(value);
    //     }
    //     return acc;
    // }

    // const filterBooks = posts.reduce(reducer, []);


    console.log('Nuu zhee = ' + JSON.stringify(neededTags))
    console.log('Nuu chto tam = ' + result)


    // const test = tags.map((it) => it == neededPosts);
    //     console.log('This need = ' + test)

   // let nuDavay = tags.map( index => index === neededPosts);
    //     console.log('Etot titles = ' + tags)
    //     console.log('Etot titles TYPEOF= ' + (typeof tags))
    // console.log('Nuzhniy id TYPEOF= ' + (typeof neededPosts))
    // console.log('Nuzhniy id = ' + neededPosts)
    // console.log('Hyyyyyyy ' + nuDavay)
   // let veryNeed = tags.filter(el => el == request.query.id);

//     for (let i = 0; i < tags.length; i++) { //проходимся по первому масиву for (let j = 0; j< neededPosts.length; j++) { // ищем соотвествия во втором массиве
//         if (tags[i] == neededPosts[j]) {
//             console.log('EEEEE' + tags[i]);// если совпадаем делаем что либо с этим значением
//         }
//     }
//     console.log('HELLO WORLD')
// };





            // console.log('This haha = ' +  tags )

//thisTags.push(request.query.id)



 // let result = posts.filter(city => city.tags === neededPosts)



//   let findByTags = function filterById(arr, id) {
//    return arr.filter(function(item, i, arr) {
//        if (item.tags == neededPosts) {
//        thisPost.push(item.text);
//        thisTags.push(item.tags);
//         thisTitle = item.title;
//         };
//    });
//   };
// //
//  findByTags(posts, neededPosts);

 if (request.query.id !== undefined) {
   response.render('home.hbs', {
     tagsPosts: foundContact
 })

 } else {
   response.render('home.hbs', {
       allPosts: posts
   });

 }
    console.log('Request == ' + request.query.id)
   // console.log('RENDER THIS ' + filteredPosts)
    // console.log('ONO ' + JSON.stringify(posts))
});

app.get("/addPost", function(request, response){
    if (sessionUser.name) {
        response.render('add_post.hbs');
        console.log(sessionUser)
    }
    else {
        response.end('please register or login');
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
    let postImage;

    console.log(typeof postTags)
    const imageChecker = function (){
        if (request.file) {
            postImage = request.file.filename;
        }
    }

    imageChecker();

    const re = postTags.split(",");

console.log(re);

        let newPost = {title: postTitle, text: postText, tags: re, author: sessionUser.name, image: postImage, id: postId  };

    let data = fs.readFileSync(postsBase,"utf8");
    let posts = JSON.parse(data);

    // добавляем пост в массив
    posts.push(newPost);
    data = JSON.stringify(posts);
    // перезаписываем файл постов
    fs.writeFileSync(postsBase, data);
    response.redirect('/');

});

app.get("/allPosts", function(request, response){
    let posts = fs.readFileSync(postsBase,"utf8");
    response.send(posts)
});

app.get("/reg-user", function (req, res) {
    res.render('reg-user');
})

app.get("/sign-in", function (req, res) {
    res.render('sign-in.hbs');
})

app.get("/readPost/", function (req, res) {
  let posts = fs.readFileSync(postsBase,"utf8");
  posts = JSON.parse(posts);

  let thisTitle;
  let thisPost;
  let thisTags;
  let thisImage;


  let neededId = req.query.id;

  let a = function filterById(arr, id) {
    return arr.filter(function(item, i, arr) {
        if (item.id == neededId) {
        thisPost = item.text;
        thisTags = item.tags;
        thisTitle = item.title;
        thisImage = item.image;

        };
    });
  };

  a(posts, neededId);

   console.log(typeof thisTags);

    res.render('full-post', {
   postTitle: thisTitle,
   postText: thisPost,
   postImage: thisImage,
   postTags: thisTags
  });
    console.log('HI ZAPROS' + req.body)
});

app.get('/api/posts', (req, res) => {
    let posts = fs.readFileSync(postsBase,"utf8");
    posts = JSON.parse(posts);

    const pageCount = Math.ceil(posts.length / 1);
    let page = parseInt(req.query.p);
    if (!page) { page = 1;}
    if (page > pageCount) {
        page = pageCount
    }
    res.json({
        "page": page,
        "pageCount": pageCount,
        "posts": posts.slice(page * 1 - 1, page * 1)
    });
});

app.listen(port, ()=> {
    console.log('Server started')
    console.log(sessionUser)

});
