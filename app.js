const express = require('express');
const path = require('path');
const fs = require('fs')
const bodyParser = require('body-parser');
const saveUser = require('./reg_controller');
const session = require("express-session");
const cookieParser = require("cookie-parser");

     // const authRoute = require('./routes/register.js');




const usersBase = path.join(__dirname, 'Api/users.json');
const jsonParser = express.json();

const port = 5000;

const app = express();

const front = path.join(__dirname, 'views');

app.use(express.static(front));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({ secret: "ololo", saveUninitialized: true, resave: true }));


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


   //  users.push(user);
   //  data = JSON.stringify(users);
   //  // перезаписываем файл с новыми данными
   // // fs.("users.json", data);
   // //  res.send(user);
   //  // let data = fs.readFileSync(usersBase, "utf8");
   //  // let users = JSON.parse(user);
   //
   //  // let bada = JSON.stringify(user);
   //  fs.appendFile(usersBase, data, function(error){
   //
   //      if(error) throw error; // если возникла ошибка
   //      console.log(error);
   //  });
   //  response.sendFile(__dirname + "/views/index.html");
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

            req.session.user = usersBase;
            req.session.save();
            res.send('Success')
            // console.log(req.session.user);
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
    response.sendFile(__dirname + "/index.html");
});


app.listen(port, ()=> {
    console.log('Server started')
    console.log(usersBase)
});