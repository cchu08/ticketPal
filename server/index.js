var express = require('express');
var mysql = require('mysql');
var db = require('./db/index.js');
var path = require('path');
var request = require('request');
var dbModel = require('./models/dbModels.js');
var seatGeekAPI = require('./controllers/seatgeekController.js');
var ticketMasterAPI = require('./controllers/ticketMasterController.js');
var dataParser = require('./utilities/dataParser.js');


var port = process.env.PORT || 5000;


var app = express();
// console.log('WHERE IS THIS SHIT', __dirname + '../client/dist/')
app.use(express.static(path.join(__dirname, '../client/dist/')));


app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
})


testObj = {
  event: 'Lady Gaga',
  location: 'San Francisco',
}




//retrieve data from the db, return to front-end

 var fakeRes= [{
      url: 'http://static.highsnobiety.com/wp-content/uploads/2016/06/14133513/kanye-west-saint-pablo-tour-00.jpg',
      highPrice: 6000,
      lowPrice: 1000,
      averagePice: 2500,
      venueName: 'Kanye West',
      id: '1AvbZfNGkMpReIg',
      date: '2017-11-20',
      apiId: 0,
      city: 'Chicago',
      venueLocation: 'United Center',
      state: 'IL'
    },
    {
      url: 'https://static1.squarespace.com/static/53682257e4b05b7433d5758f/539a532ae4b0f5b6f0a50361/539a532be4b0377ac69271ee/1402622764232/Kaskade.jpg',
      highPrice: 2000,
      lowPrice: 200,
      averagePice: 900,
      venueName: 'Kaskade ',
      id: '1AvbZfNGkMpReIg',
      date: '2017-11-20',
      apiId: 0,
      city: 'San Francisco',
      venueLocation: 'Bill Graham Auditorium',
      state: 'CA'
    },
    {
      url: 'http://static.stereogum.com/uploads/2014/09/Jeezy.jpg',
      highPrice: 1488.75,
      lowPrice: 46,
      averagePice: 381,
      venueName: 'Young Jeezy',
      id: '1AvbZfNGkMpReIg',
      date: '2017-11-20',
      apiId: 0,
      city: 'Los Angeles',
      venueLocation: 'Fonda Theater',
      state: 'LA'
    }]



app.post('/event', function(req, res) {
  var body = '';
  req.on('data', function(chunk) {
    body += chunk;
  })
  req.on('end', function() {
    var userInput = JSON.parse(body);
    console.log('Post Request ', userInput);

    seatGeekAPI.seatGeekGetter(seatGeekAPI.seatGeekData, userInput.event, userInput.location, function(err, results) {
      if (err) {
        console.log(err)
      } else {

        // console.log('SG res success!', results);

        db.addTicketMasterToDataBase(results);
      }
    })
        //ticket master api query with
    ticketMasterAPI.queryTicketMasterForEvent(ticketMasterAPI.ticketmasterData, userInput, function(err, data) {
      // console.log("this is the event id ", ticketMasterAPI.ticketmasterData.id)
      if(err) {
        console.log('Error on query', err);
      } else {
        ticketMasterAPI.queryTicketMasterForPrices(ticketMasterAPI.ticketmasterData, ticketMasterAPI.ticketmasterData.id, function(err, data2) {
          if(err) {
            console.log('Error in Ticket Master Price query', err);
          } else {
            ticketMasterAPI.ticketmasterDataParser(ticketMasterAPI.ticketmasterData, JSON.parse(data2));

            db.addTicketMasterToDataBase(ticketMasterAPI.ticketmasterData);
            console.log(ticketMasterAPI.ticketmasterData)

            var tmResponse = ticketMasterAPI.ticketmasterData;

            dataParser.seatGeekListCheck(userInput.event, userInput.location, function(err, results) {
              if (err) {
                console.log(err);
              } else {

                var arrayToClient = [];
                arrayToClient[0] = tmResponse;
                var result = JSON.parse(JSON.stringify(results));
                for (var i = 0; i < result.length; i++) {
                  arrayToClient.push(result[i]);
                }
                res.end(JSON.stringify(arrayToClient));
              }
            });
          }
        })
      }
    });
  })
})



app.get('/home', function(req, res) {
  // console.log('Get Request Recieved!')
  // res.end(JSON.stringify(fakeRes))

  // console.log('Get Request Recieved!');

  db.getTopThreeTrending(function (err, results) {
    if(err) {
      console.log('err heppend server side');
    } else {
      console.log('sending results')
      res.send(results);
    }
  })


});

//changed port
app.listen(port, function(){
  console.log('listening on', port);
});
