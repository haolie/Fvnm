var express = require('express');
var app = express();
var dataSearch = require('./dataSearcher.js');
global.shcode = 912261;

app.use('/view', express.static('./../views'));

// app.get('/', function (req, res) {
//     res.send('Hello World!');
// });

app.get('/view/querydates',dataSearch.searchDates);

app.get('/view/queryNoByDate',dataSearch.searchNoInDate);

app.get('/view/queryNoDateValue',dataSearch.searchDateNoData);

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

});