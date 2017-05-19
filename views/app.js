$("#scraped").on("click", function(event) {

    event.preventDefault();

    $.get("/scrape").done(function(data) {
    	$('#resultsModal').modal('open');
    	
        // $(".scrape-results").text(data.message);
        // $("#scrape-success").modal("show");
    });
});
