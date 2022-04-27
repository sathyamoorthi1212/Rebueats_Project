const http = require('http');
const express = require('express');
const app = express(); 
const socketioJwt  = require("socketio-jwt");
const Config       = require('config');
const driverModel  = require('../models/Driver');
//const orderModel  = require('../models/Order');
const Socketio = require('socket.io');
const server = http.createServer(app);
//const io = require('socket.io')(server);
const port=3000,
      host = Config.server.host;
//const io = require('socket.io').listen(server.listen(port));
//var io=  require('socket.io')(server);  
exports.get = function(req,res) {
     const io = req.app.get('socketio');
     return io;
}
   //console.log("io",io)


        io.sockets
          
          .on('connection', socketioJwt.authorize({
            secret: Config.API_SECRET,
            timeout: 15000 // 15 seconds to send the authentication message
          })).on('authenticated', function(socket) {

            
            console.log('hello! ' + socket.decoded_token._id);
           //io.on('connection', (socket) => {          
            console.log("connected server",socket.id);

            /**
             * Init Socket Event Example
             *
             * @data Empty String
            */
            socket.on('initialize', () => {                        
               console.log("Welcome new user")       
            });

            /**
             * Update driver location on init
             *
             * @data drvierId, latitude, longitude
            */
            socket.on('init', (data) => {   

                    driverModel().update_driver_location(data)
                        .then((data) => {
                            console.log(data);
                            socket.emit('init', { status: 'success', data: data });
                        }).catch((error) => {
                            socket.emit('init', { status: 'failure', data: error });
                        })            
            });


            /** 
              Empty Order assingn
            **/

            socket.on('getData', () => {   

                let data={
                    pickAddress:"k.k.nagar",
                    dropDetailAddress:"Simmakkal",
                    orderCode:"Rebueats-000001",
                    OrderId:"5d0e2cf46ed3d97dd513e380"
                }   
                console.log(data);
                socket.emit('getData', { status: 'success', data: data });
                       
                                     
            });
            /**
             * Get driver List on init
             *
             * @data latitude, longitude,RadiusLimit
            */
            socket.on('driverList', (data) => {  
                   var data=JSON.parse(data);                  
                   driverModel().getDriverDistance(data.latitude,data.longitude,data.distanceMetre)
                        .then((res) => {
                            socket.emit('driverList', { status: 'success', data: res });
                        }).catch((error) => {
                            socket.emit('driverList', { status: 'failure', data: error });
                        })            
            });
            /**
             * To Disconnect or Logout Event
             *
             * @data latitude, longitude,RadiusLimit
            */

            socket.on('disconnect', function(){
                console.log('Server has disconnected from the client ' + socket.id);
            });
        });


/*server.listen(3000, () => {
  console.log(`Socket Server running at:3000`);
});*/

    
/*const io = require('socket.io').listen(server,{
    pingInterval: 10000,
    pingTimeout: 50000,
});
var users = {}; 

io.on('connect', function(socket) {
            console.log(socket)        

    socket.on('create',function(data){
        // if(users[] ){
        //     console.log('already exists')
        // }
        // else{
        //     users[socket.id] = data;
        //     online_user.push(data)
        // }
        console.log(data)        
    })
});
*/

