var loadingMessages = [
    "Fülle Popcorn nach...",
    "Öffne Kinosaal...",
    "Schreibe Spielplan...",
    "Starte Rakete zum Mond...",
    "Rette die Welt..."
]

$(document).ready(function () {
    $("#loading-text").text(loadingMessages[Math.floor(Math.random()*loadingMessages.length)]);

    var date = new Date();
    var todayFormatted = "datum_" + date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2);
    var movieList = new Array();

    console.log("Today:\t" + todayFormatted);

    var httpsUrl = "https://whateverorigin.herokuapp.com/get?url=";
    var httpUrl = "http://whateverorigin.org/get?url=";

    $.getJSON(httpsUrl +
        encodeURIComponent("http://www.citydome-sinsheim.com/programm") + "&callback=?",
        function (data) {
            //console.log("> ", data);

            var result = extractJSON(data.contents);

            var movies = result[0].filme;

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

                if (datesToday) {
                    if ($.type(datesToday) == "array") {
                        $.each(datesToday, function (index, showing) {
                            var showingRoom = showing.saal_bezeichnung;
                            var showingTimeStart = showing.zeit;
                            var tmp = new Date();
                            tmp.setHours(showing.zeit.substr(0,2));
                            tmp.setMinutes(showing.zeit.substr(3,5));
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
                        var showingTimeEndEST = datesToday.zeit;

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

            movieList.sort(SortByShowingRoom);
            movieList.sort(SortByShowingTimeStart);

            $("#loading-container").hide();
            $("#table-container").show();

            var i = 0;
            movieList.forEach(function (movie) {

                $("#table").bootstrapTable("insertRow", {
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
        });
})

function extractJSON(str) {
    var firstOpen, firstClose, candidate;
    firstOpen = str.indexOf('{', firstOpen + 1);
    do {
        firstClose = str.lastIndexOf('}');
        console.log('firstOpen: ' + firstOpen, 'firstClose: ' + firstClose);
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

function SortByShowingRoom(a, b) {
    var aRoom = a.showingRoom.slice(-1);
    var bRoom = b.showingRoom.slice(-1);
    return ((aRoom < bRoom) ? -1 : ((aRoom > bRoom) ? 1 : 0));
}

function SortByShowingTimeStart(a, b) {
    var aShowingTimeStart = a.showingTimeStart;
    var bShowingTimeStart = b.showingTimeStart;
    return ((aShowingTimeStart < bShowingTimeStart) ? -1 : ((aShowingTimeStart > bShowingTimeStart) ? 1 : 0));
}