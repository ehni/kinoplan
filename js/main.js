var loadingMessages = [
    "Fülle Popcorn nach...",
    "Öffne Kinosaal...",
    "Schreibe Spielplan...",
    "Starte Rakete zum Mond...",
    "Rette die Welt..."
]
var movieList = new Array();

var date = new Date();
var todayFormatted = "datum_" + date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2);

$(document).ready(function () {
    console.log("[INFO] Script geladen")
    console.log("[INFO] Today:\t" + todayFormatted);
    
    // Init tooltips
    $(function () {
        $('[data-toggle="tooltip"]').tooltip({
            trigger: "hover"
        })
    })

    setRandomLoadingMessage();

    var httpsUrl = "https://whateverorigin.herokuapp.com/get?url=";

    $.getJSON(httpsUrl +
        encodeURIComponent("http://www.citydome-sinsheim.com/programm") + "&callback=?",
        function (data) {
            console.log("[INFO] Kinoplan erhalten");

            var result = extractJSON(data.contents);

            console.log("[INFO] JSON extrahiert")

            var movies = result[0].filme;

            var tmp = new Date();

            $.each(movies, function (index, movie) {
                var filmfacts = movie.filmfakten;
                var title = filmfacts.titel;
                var playtime = filmfacts.laufzeit;
                var effects = filmfacts.Versionsmarker;
                var fsk = filmfacts.fsk;
                var showings = movie.vorstellungen;
                var dates = showings.termine;
                var datesToday = dates[todayFormatted];

                if (fsk == 0) {
                    fsk = "Keine Altersbeschränkung";
                }

                if ($.type(fsk) == "object") {
                    fsk = "Noch nicht bekannt";
                }

                if (datesToday) {
                    if ($.type(datesToday) == "array") {
                        $.each(datesToday, function (index, showing) {
                            var showingRoom = showing.saal_bezeichnung;
                            var showingTimeStart = showing.zeit;
                            tmp.setHours(showing.zeit.substr(0, 2));
                            tmp.setMinutes(showing.zeit.substr(3, 5));
                            tmp.setMinutes(tmp.getMinutes() + parseInt(playtime));
                            var showingTimeEndEST = ("0" + tmp.getHours()).slice(-2) + ":" + ("0" + tmp.getMinutes()).slice(-2);

                            var showingListItem = {
                                "title": title,
                                "fsk": fsk,
                                "effects": effects,
                                "playtime": playtime,
                                "showingRoom": showingRoom,
                                "showingTimeStart": showingTimeStart,
                                "showingTimeEndEST": showingTimeEndEST
                            }
                            movieList.push(showingListItem);
                        })
                    }

                    if ($.type(datesToday) == "object") {
                        var showingRoom = datesToday.saal_bezeichnung;
                        var showingTimeStart = datesToday.zeit;
                        tmp.setHours(datesToday.zeit.substr(0, 2));
                        tmp.setMinutes(datesToday.zeit.substr(3, 5));
                        tmp.setMinutes(tmp.getMinutes() + parseInt(playtime));
                        var showingTimeEndEST = ("0" + tmp.getHours()).slice(-2) + ":" + ("0" + tmp.getMinutes()).slice(-2);

                        var showingListItem = {
                            "title": title,
                            "fsk": fsk,
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

            console.log("[INFO] Aktuellen Plan heraus gesucht")

            movieList.sort(sortByShowingRoomShowingTimeStart);

            console.log("[INFO] Aktuellen Plan sortiert")


            fillTableWithMovieList();
        });
})

function setRandomLoadingMessage() {
    $("#loading-text").text(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
}

function fillTableWithMovieList() {
    var table = $("#table");
    table.bootstrapTable("destroy");
    table.bootstrapTable();
    var i = 0;
    movieList.forEach(function (movie) {
        table.bootstrapTable("insertRow", {
            index: i++,
            row: {
                title: movie.title,
                fsk: movie.fsk,
                effects: movie.effects,
                playtime: movie.playtime,
                showingRoom: movie.showingRoom,
                showingTimeStart: movie.showingTimeStart,
                showingTimeEndEST: movie.showingTimeEndEST
            }
        })
    })

    $("#loading-container").hide();
    $("#table-container").show();

    console.log("[INFO] Tabelle aktualisiert")
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

function extractJSON(str) {
    var firstOpen, firstClose, candidate;
    firstOpen = str.indexOf('{', firstOpen + 1);
    do {
        firstClose = str.lastIndexOf('}');
        //console.log('firstOpen: ' + firstOpen, 'firstClose: ' + firstClose);
        if (firstClose <= firstOpen) {
            return null;
        }
        do {
            //console.log($.type(data));
            candidate = str.substring(firstOpen, firstClose + 1);
            //console.log('candidate: ' + candidate);
            try {
                var res = JSON.parse(candidate);
                //console.log('...found');
                return [res, firstOpen, firstClose + 1];
            }
            catch (e) {
                //console.log('...failed');
            }
            firstClose = str.substr(0, firstClose).lastIndexOf('}');
        } while (firstClose > firstOpen);
        firstOpen = str.indexOf('{', firstOpen + 1);
    } while (firstOpen != -1);
}