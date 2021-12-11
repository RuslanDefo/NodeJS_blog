const express = require('express');
const fs = require('fs');
const path = require("path");
const router = express.Router();
const jsonParser = express.json();

const usersBase = path.join(__dirname, 'Api/users.json');


// app.post("/reg-user", jsonParser, function (request, response) {
//
//     if(!request.body) return response.sendStatus(400);
//
//     let bada = JSON.stringify(request.body);
//     fs.appendFile(usersBase, bada, function(error){
//
//         if(error) throw error; // если возникла ошибка
//         console.log(error);
//     });
//     response.sendFile(__dirname + "/views/indexTEST.html");
// });


module.exports = router;



// app.post("/reg-user", jsonParser, function (request, response) {
// //
// //     if(!request.body) return response.sendStatus(400);
// //
// //     let bada = JSON.stringify(request.body);
// //     fs.appendFile(usersBase, bada, function(error){
// //
// //         if(error) throw error; // если возникла ошибка
// //         console.log(error);
// //     });
// //     response.sendFile(__dirname + "/views/indexTEST.html");
// // });



// app.post("/reg-user", jsonParser, function (request, response) {
//
//
//     if(!request.body) return response.sendStatus(400);
//
//     const userLogin = request.body.userLogin;
//     const userMail = request.body.userMail;
//     const userPass = request.body.userPass;
//     let user = {name: userLogin, mail: userMail, pass:userPass};
//
//
//     let data = fs.readFileSync(usersBase,"utf8");
//     let users = JSON.parse(data);
//
//
//     users.push(user);
//     data = JSON.stringify(users);
//     // перезаписываем файл с новыми данными
//     // fs.("users.json", data);
//     //  res.send(user);
//     // let data = fs.readFileSync(usersBase, "utf8");
//     // let users = JSON.parse(user);
//
//     // let bada = JSON.stringify(user);
//     fs.appendFile(usersBase, data, function(error){
//
//         if(error) throw error; // если возникла ошибка
//         console.log(error);
//     });
//     response.sendFile(__dirname + "/views/indexTEST.html");
// });