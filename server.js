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
// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;


// Initialize Express
var app = express();

// Use morgan and body parser with our app
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
    extended: false
}));

// Make public a static dir
app.use(express.static("public"));

// Set Handlebars.
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Database configuration with mongoose
mongoose.connect("mongodb://localhost/mongoosearticles");
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
    console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
    console.log("Mongoose connection successful.");
});


// Routes
// ======

// A GET request to scrape the echojs website
app.get("/scrape", function(req, res) {
    // First, we grab the body of the html with request
    request("http://www.livescience.com/", function(error, response, html) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(html);
        // Now, we grab every h2 within an article tag, and do the following:
        $(".pure-u-3-4").each(function(i, element) {

            // Save an empty result object
            var result = {};

            // Add the text and href of every link, and save them as properties of the result object
            result.title = $(this).children("h2").text();
            result.date = $(this).find(".date-posted").text();
            result.summary = $(this).find(".mod-copy").text();
            result.link = $(this).children("a").attr("href");

            // Using our Article model, create a new entry
            // This effectively passes the result object to the entry (and the title and link)
            var entry = new Article(result);

            // Now, save that entry to the db
            entry.save(function(err, doc) {
                // Log any errors
                if (err) {
                    console.log(err);
                }
                // Or log the doc
                else {
                    console.log(doc);
                }
            });

        });
    });
    // Tell the browser that we finished scraping the text
    res.send("Scrape Complete");
});

// This will get the articles we scraped from the mongoDB
app.get("/articles", function(req, res) {

    Article.find({}, function(error, doc) {
        // Send any errors to the browser
        if (error) {
            res.send(error);
        }
        // Or send the doc to the browser
        else {
            res.send(doc);
        }
    });
    // TODO: Finish the route so it grabs all of the articles


});

// This will grab an article by it's ObjectId
app.get("/articles/:id", function(req, res) {
     Article.findOne({"_id": req.params.id})
    // ..and string a call to populate the entry with the notes stored in the user's notes array
    // This simple query is incredibly powerful. Remember this one!
    .populate("note")
    // Now, execute that query
    .exec(function(error, doc) {
      // Send any errors to the browser
      if (error) {
        res.send(error);
      }
      // Or, send our results to the browser, which will now include the notes stored in the user
      else {
        res.send(doc);
      }
    });

});

// Create a new note or replace an existing note
app.post("/articles/:id", function(req, res) {
   // Use our Note model to make a new note from the req.body
  var newNote = new Note(req.body);
  // Save the new note to mongoose
  newNote.save(function(error, doc) {
    // Send any errors to the browser
    if (error) {
      res.send(error);
    }
    // Otherwise
    else {
      // Find our user and push the new note id into the User's notes array
      Article.findOneAndUpdate({"_id": req.params.id}, { "note": doc._id }, {new: true})
        // Send any errors to the browser
        .exec(function(err, doc) {
        if (err) {
          res.send(err);
        }
        // Or send the newdoc to the browser
        else {
          res.send(doc);
        }
      });
    }
  });

});


// Listen on port 3000
app.listen(3000, function() {
    console.log("App running on port 3000!");
});
