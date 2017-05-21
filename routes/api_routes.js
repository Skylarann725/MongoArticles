// Our scraping tools
var request = require("request");
var cheerio = require("cheerio");

// Requiring our Note and Article models
var Note = require("../models/note.js");
var Article = require("../models/article.js");

// Routes
// ======
module.exports = function(app) {
    // A GET request to scrape the echojs website
    app.get("/scrape", function(req, res) {
        // First, we grab the body of the html with request
        request("http://www.livescience.com/news?type=article", function(error, response, html) {
            //Check for error
            if (error) {
                throw error;
            }
            // Then, we load that into cheerio and save it to $ for a shorthand selector
            var $ = cheerio.load(html);
            // Now, we grab every h2 within an article tag, and do the following:
            $(".contentListing").each(function(i, element) {

                // Saves an empty result object
                var result = {};

                // Add the text and href of every link, and save them as properties of the result object
                result.title = $(this).find(".pure-u-3-4").children("h2").text();
                result.image = $(this).find(".search-item a img").attr("src");
                result.content = $(this).find(".pure-u-3-4").find(".mod-copy").text();
                result.link = $(this).find(".pure-u-3-4").find(".mod-copy").find("a").attr("href");

                // Using our Article model, creates a new entry
                // This effectively passes the result object to the entry (and the title and link)
                var entry = new Article(result);

                // Saves that entry to the db
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
            res.redirect("/");
        });
    });

    // This will get the articles we scraped from the mongoDB
    app.get("/", function(req, res) {

        Article.find({}, function(error, doc) {
            // Send any errors to the browser
            if (error) {
                res.send(error);
            }
            // Or send the doc to the browser
            else {
                var hbsObject = {
                    articles: doc
                };
                console.log(hbsObject);
                res.render("index", hbsObject);
            }
        });

    });

    // This will get the articles that have been saved
    app.get("/saved", function(req, res) {

        Article.find({ "saved": true }, function(error, doc) {
            // Send any errors to the browser
            if (error) {
                res.send(error);
            }
            // Or send the doc to the browser
            else {
                var hbsObject = {
                    articles: doc
                };
                console.log(hbsObject);
                res.render("saved", hbsObject);
            }
        });

    });

    // This will grab an article by it's ObjectId
    app.post("/saved/:id", function(req, res) {
        Article.findOneAndUpdate({"_id": req.params.id}, {$set: {'saved': true}}, function(error, doc) {
                // Send any errors to the browser
                if (error) {
                    res.send(error);
                }
                // Or, send our results to the browser, which will now include the notes stored in the user
                else {
                    res.redirect("/");
                }
            });
    });

    // This will remove an article from our saved items
    app.post('/remove/saved/:id', function(req, res) {

        Article.findOneAndUpdate({ '_id': req.params.id }, { $set: { 'saved': false } }, function(error, doc) {
            if (error) {
                console.log(error);
            } else {
                res.redirect('/');
            }
        });
    });


    // Grab all notes for selected article
    app.get("/getnote/:id", function(req, res) {

        Article.findOne({ "_id": req.params.id })
            .populate("note")
            .exec(function(error, doc) {
                if (error) {
                    console.log(error);
                } else {
                    res.json(doc);
                }
            });
    });

    // Create a new note or replace an existing note
    app.post("/savednote/:id", function(req, res) {
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
                Article.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id }, { new: true })
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
};
