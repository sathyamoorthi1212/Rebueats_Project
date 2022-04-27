const io = require('socket.io-client');
var your_jwt='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZDFlZmU2MmZjMTdlZTViMWY0ZDU3YmUiLCJpYXQiOjE1NjQ0ODA4MDgsImV4cCI6MTU2NDU2NzIwOH0.ALsrLU-GKrXzpnAWF4NJlRSGTiSGck_Q9hRM7qE7kNc';
const socket = io.connect('http://10.1.1.34:3000');


socket.on('connect', function () {
  socket
    .emit('authenticate', {token: your_jwt}) //send the jwt
    .on('authenticated', function(data) {
      console.log("Connected");
    })
    .on('unauthorized', function(msg) {
      console.log("unauthorized: " + JSON.stringify(msg.data));
      //throw new Error(msg.data);
    })
    //.emit('init', {"deliveryboyid": '5d10675c5de0674a6472bd4d', "longitude": 78.13056,"latitude":9.9265})
    .on('init', (data1) => {  
      console.log("data",data1)
    })
    //.emit('driverList', {"distanceMetre":5000 , "longitude": 78.12,"latitude":9.92})
     .on('driverList', (data1) => {  
      console.log("driverList",data1)
    })
     .emit('getData')
     .on('getData', (data1) => {  
      console.log("driverList",data1)
    })
    socket.emit('disconnect')
});















 /*socket.emit('initialize');
 socket.emit('init', {deliveryboyid: '5d10675c5de0674a6472bd4d', longitude: 78.13056,latitude:9.9265});
 socket.emit('driverList', {distanceMetre:5000 , longitude: 78.12,latitude:9.92});

 socket.on('init', (data1) => {  
      console.log("data",data1)
  }); 
 socket.on('driverList', (data1) => {  
      console.log("driverList",data1)
  });


 */