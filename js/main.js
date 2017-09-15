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
var httpsUrl = "https://whateverorigin.herokuapp.com/get?url=";
var date = new Date();
var currentDate = "datum_" + date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2);

$(document).ready(function () {
    // Show loading message
    setRandomLoadingMessage();

    // Init datepicker
    $("#datetimepicker").datetimepicker({
        format: "DD.MM.YYYY",
        viewMode: "days",
        showTodayButton: true,
        ignoreReadonly: true,
        allowInputToggle: true,
        icons: {
            time: 'fa fa-clock-o',
            date: 'fa fa-calendar',
            up: 'fa fa-chevron-up',
            down: 'fa fa-chevron-down',
            previous: 'fa fa-chevron-left',
            next: 'fa fa-chevron-right',
            today: 'fa fa-calendar-times-o',
            clear: 'fa fa-trash',
            close: 'fa fa-times'
        }
    }).on("dp.show", function (e) {
        $(".picker-switch a[data-action='today']").html("Heute").addClass("btn btn-secondary datetimepicker-today-button");
        $(".picker-switch").attr("data-action", "");
        $(".bootstrap-datetimepicker-widget").tooltip({
            trigger: "manual",
            animated: "fade",        
            placement: "top",
            title: "Wähle ein Datum aus um die Filme für diesen Tag anzuzeigen. Für ausgegraute Tage liegen keine Informationen vor."
        }).tooltip("show");
    });

    // Retreive date from the web
    $.getJSON(httpsUrl +
        encodeURIComponent("http://www.citydome-sinsheim.com/programm") + "&callback=?",
        function (data) {

            var result = extractJSON(data.contents);

            movies = result[0].filme;

            // Set date to today
            $("#datetimepicker").datetimepicker("date", date);

            // Init movie table for the first time. Because
            // the current date is already set in the global currentDate
            // variable the function won't get called
            loadMovieList();

            checkAvailableDates();
        });

})

/**
 * Hide the tooltip for the datepicker when the datepicker is closed
 */
$("#datetimepicker").on("dp.hide", function (e) {
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
$("#datetimepicker").on("dp.change", function (e) {

    $("#datetimepicker").datetimepicker("hide");

    var inputDate = $("#datetimepicker").val();

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
        var imgUrl = "https://www.cineprog.de/images/Breite_235px_RGB/";

        if ($.type(filmfacts.plakat_ids) == "object") {
            imgUrl = imgUrl.concat(filmfacts.plakat_ids.id);
        } else if ($.type(filmfacts.plakat_ids) == "array") {
            imgUrl = imgUrl.concat(filmfacts.plakat_ids[0].id);
        } else {
            imgUrl = null;
        }

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

        var fskShort = fsk.substr(0, 5);

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
                        "imgUrl": imgUrl,
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
                    "imgUrl": imgUrl,
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
 * Goes through all available data and finds the dates.
 * Then sets only these dates available in the datetimepicker
 */
function checkAvailableDates() {
    var dateList = new Array();

    $.each(movies, function (index, movie) {
        var dates = movie.vorstellungen.termine;
        $.each(dates, function (index, dateItem) {
            if ($.type(dateItem) == "object") {
                dateList.push(new Date(dateItem.datum.substr(0, 4), (dateItem.datum.substr(5, 2) - 1), dateItem.datum.substr(8, 2)));
            } else if ($.type(dateItem) == "array") {
                $.each(dateItem, function (index, singleDateItem) {
                    dateList.push(new Date(singleDateItem.datum.substr(0, 4), (singleDateItem.datum.substr(5, 2) - 1), singleDateItem.datum.substr(8, 2)));
                })
            }
        })
    })

    $("#datetimepicker").datetimepicker("enabledDates", dateList);
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

    $("#loading-container").hide();
    $("#table-container").show();
    $(".table-cell-tooltip").tooltip({
        animated: "fade",
        html: true,
    });
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

/**
 * Cut long movie titles by "-"  or "und" or finally
 * simply to max 12 chars
 */
function movieTitleFormatter (value, row) {
    var shortTitle = row.title;
    if (row.title.indexOf("-") > 0) {
        shortTitle = row.title.split("-", 1)[0];
    } else if (row.title.indexOf("und") > 0) {
        shortTitle = row.title.split("und", 1)[0];
    } else {
        shortTitle =  row.title.substr(0,12);
    }

    var tooltipContent = row.title;

    if (row.imgUrl) {
        var tooltipContent = row.title.concat("<br>" + "<img class='tooltip-img' src='" + row.imgUrl + "'/>");        
    }

    return [
        '<a class="table-cell-tooltip" data-original-title="' + row.title + '" data-toggle="tooltip" data-placement="bottom" data-container="body" title="' + tooltipContent + '">',
        shortTitle,
        '</a>'
    ].join('');
}