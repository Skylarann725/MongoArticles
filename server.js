/* Scrape and Display
 * ================================================== */

// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
// Requiring our Note and Article models
var Note = require("./models/note.js");
var Article = require("./models/article.js");
// Our scraping tools
var request = require("request");
var cheerio = require("cheerio");

// Initialize Express
var PORT = process.env.PORT || 3000;
var app = express();

// Use morgan and body parser with our app
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
    extended: false
}));

// Make public a static dir
app.use(express.static("./public"));

// Set Handlebars.
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;

// Database configuration with mongoose
var databaseURI = 'mongodb://localhost/webscrape'
var mongodbURI = 'mongodb://heroku_h7nvdmd7:eijo3ubs7vchufh9dh79g4lq7s@ds149431.mlab.com:49431/heroku_h7nvdmd7'

if (PORT) {
	mongoose.connect(mongodbURI);
} else {
	mongoose.connect(databaseURI);
}

var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
    console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
    console.log("Mongoose connection successful.");
});

//Routes
require("./routes/api_routes.js")(app);

// Listen on port 3000
app.listen(3000, function() {
    console.log("App running on port 3000!");
});
