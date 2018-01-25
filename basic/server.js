
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var exphbs  = require('express-handlebars');

// *** routes *** //
var routes = require('./routes/index.js');

// *** express instance *** //
var app = express();

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// *** static directory *** //
app.set('views', path.join(__dirname, 'views'));

// *** config middleware *** //
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, './client/public')));


// *** main routes *** //
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

var server = app.listen(3000, function () {

  var port = server.address().port;
  console.log('Example app listening on port ', port);

});

module.exports = app;
