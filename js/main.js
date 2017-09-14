// Init variables
var loadingMessages = [
    "Fülle Popcorn nach...",
    "Öffne Kinosaal...",
    "Schreibe Spielplan...",
    "Starte Rakete zum Mond...",
    "Rette die Welt..."
]
var movies = null;
var movieList = new Array();
var currentDate = null;
var httpsUrl = "https://whateverorigin.herokuapp.com/get?url=";
var date = new Date();
var currentDate = "datum_" + date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2);

$(document).ready(function () {
    // Show loading message
    setRandomLoadingMessage();

    // Init datepicker
    $(".datepicker").datepicker({
        format: "dd.mm.yyyy",
        autoclose: true,
        disableTouchKeyboard: true,
        language: "de",
        maxViewMode: "days",
        minViewMode: "days",
        todayBtn: "linked",
        todayHighlight: true
    }).on("show", function (e) {
        $(".datepicker-dropdown").tooltip({
            trigger: "manual",
            placement: "top",
            title: "Wähle ein Datum aus um die Filme für diesen Tag anzuzeigen"
        }).tooltip("show");
    });

    // Retreive date from the web
    $.getJSON(httpsUrl +
        encodeURIComponent("http://www.citydome-sinsheim.com/programm") + "&callback=?",
        function (data) {

            var result = extractJSON(data.contents);

            movies = result[0].filme;

            // Set date to today
            $(".datepicker").datepicker("update", currentDate);

            // Init movie table for the first time. Because
            // the current date is already set in the global currentDate
            // variable the function won't get called
            loadMovieList();
        });

})

/**
 * Hide the tooltip for the datepicker when the datepicker is closed
 */
$("#datepicker").on("hide", function(e) {
    // Hide open tooltips
    $(".tooltip").tooltip("hide");
});

/**
 * Listener for the datepicker
 * Gets called when the date is changed and checks
 * if the new date is different from the current date.
 * If so, the movie list will be reloaded to show the
 * movies according to the date
 */
$("#datepicker").on("change", function (e) {

    var inputDate = $("#datepicker").val();

    var newDate = "datum_" + inputDate.substr(6, 4) + "-" + inputDate.substr(3, 2) + "-" + inputDate.substr(0, 2);

    if (newDate == currentDate) {
        return;
    } else {
        currentDate = newDate;
    }

    loadMovieList();
})

/**
 * Load the movie list depending on the given date set
 * in the currentDate variable
 */
function loadMovieList() {

    // Load new loading message and show loading div
    setRandomLoadingMessage();
    $("#loading-container").show();
    $("#table-container").hide();

    var tmp = new Date();

    // Clear movie list before filling with new data
    movieList = new Array();

    // Go through the movies data and search for movies
    // for the given currentDate
    $.each(movies, function (index, movie) {
        var filmfacts = movie.filmfakten;
        var title = filmfacts.titel;
        var playtime = filmfacts.laufzeit;
        var effects = filmfacts.Versionsmarker;
        var fsk = filmfacts.fsk;
        var showings = movie.vorstellungen;
        var dates = showings.termine;
        var datesToday = dates[currentDate];
        var showingTimeEndEST = null;

        if ($.isEmptyObject(playtime)) {
            playtime = "Noch nicht bekannt";
            showingTimeEndEST = "Noch nicht bekannt";
        }

        if (fsk == 0) {
            fsk = "Keine Altersbeschränkung";
        }

        if ($.type(fsk) == "object") {
            fsk = "Noch nicht bekannt";
        }

        var fskShort = fsk.substr(0,5);

        if (datesToday) {
            // If there are multiple showings for the movie
            // go through each showing
            if ($.type(datesToday) == "array") {
                $.each(datesToday, function (index, showing) {
                    var showingTimeEndEST = showingTimeEndEST;
                    var showingRoom = showing.saal_bezeichnung;
                    var showingTimeStart = showing.zeit;
                    if (!showingTimeEndEST) {
                        tmp.setHours(showing.zeit.substr(0, 2));
                        tmp.setMinutes(showing.zeit.substr(3, 5));
                        tmp.setMinutes(tmp.getMinutes() + parseInt(playtime));
                        showingTimeEndEST = ("0" + tmp.getHours()).slice(-2) + ":" + ("0" + tmp.getMinutes()).slice(-2);
                    }
                    

                    var showingListItem = {
                        "title": title,
                        "fsk": fsk,
                        "fskShort": fskShort,
                        "effects": effects,
                        "playtime": playtime,
                        "showingRoom": showingRoom,
                        "showingTimeStart": showingTimeStart,
                        "showingTimeEndEST": showingTimeEndEST
                    }
                    movieList.push(showingListItem);
                })
            }

            // In case of only one showing
            if ($.type(datesToday) == "object") {
                var showingRoom = datesToday.saal_bezeichnung;
                var showingTimeStart = datesToday.zeit;
                if (!showingTimeEndEST) {
                    tmp.setHours(datesToday.zeit.substr(0, 2));
                    tmp.setMinutes(datesToday.zeit.substr(3, 5));
                    tmp.setMinutes(tmp.getMinutes() + parseInt(playtime));
                    showingTimeEndEST = ("0" + tmp.getHours()).slice(-2) + ":" + ("0" + tmp.getMinutes()).slice(-2);
                }

                var showingListItem = {
                    "title": title,
                    "fsk": fsk,
                    "fskShort": fskShort,
                    "effects": effects,
                    "playtime": playtime,
                    "showingRoom": showingRoom,
                    "showingTimeStart": showingTimeStart,
                    "showingTimeEndEST": showingTimeEndEST
                }
                movieList.push(showingListItem);
            }
        }
    })


    // Sort list
    movieList.sort(sortByShowingRoomShowingTimeStart);

    fillTableWithMovieList();
}

/**
 * Display a random loading message from 
 * the loadingMessages array
 */
function setRandomLoadingMessage() {
    $("#loading-text").text(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
}

/**
 * Go through the movie list and append each item to the table
 */
function fillTableWithMovieList() {
    var table = $("#table");
    table.bootstrapTable("destroy");
    table.bootstrapTable({
        data: movieList
    });
    // var i = 0;
    // movieList.forEach(function (movie) {
    //     table.bootstrapTable("insertRow", {
    //         index: i++,
    //         row: {
    //             title: movie.title,
    //             fsk: movie.fsk,
    //             effects: movie.effects,
    //             playtime: movie.playtime,
    //             showingRoom: movie.showingRoom,
    //             showingTimeStart: movie.showingTimeStart,
    //             showingTimeEndEST: movie.showingTimeEndEST
    //         }
    //     })
    // })

    $("#loading-container").hide();
    $("#table-container").show();
}

function sortByShowingRoomShowingTimeStart(a, b) {
    var aRoom = a.showingRoom.slice(-1);
    var bRoom = b.showingRoom.slice(-1);
    var aShowingTimeStart = a.showingTimeStart;
    var bShowingTimeStart = b.showingTimeStart;

    if (aShowingTimeStart == bShowingTimeStart) {
        return (aRoom < bRoom) ? -1 : (aRoom > bRoom) ? 1 : 0;
    }
    else {
        return (aShowingTimeStart < bShowingTimeStart) ? -1 : 1;
    }
}

/**
 * Finds json objects in the given string
 * Stolen from https://stackoverflow.com/a/10574546/7
 * Thank you ThiefMaster!
 * 
 * @param {*} str String to search in for json objects
 */
function extractJSON(str) {
    var firstOpen, firstClose, candidate;
    firstOpen = str.indexOf('{', firstOpen + 1);
    do {
        firstClose = str.lastIndexOf('}');
        if (firstClose <= firstOpen) {
            return null;
        }
        do {
            candidate = str.substring(firstOpen, firstClose + 1);
            try {
                var res = JSON.parse(candidate);
                return [res, firstOpen, firstClose + 1];
            }
            catch (e) {
            }
            firstClose = str.substr(0, firstClose).lastIndexOf('}');
        } while (firstClose > firstOpen);
        firstOpen = str.indexOf('{', firstOpen + 1);
    } while (firstOpen != -1);
}