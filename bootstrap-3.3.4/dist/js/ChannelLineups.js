
//--------------------
//--Global Variables--
//--------------------
//var serviceAddress = "http://localhost:10047/LineupRestService.svc/";
var serviceAddress = "https://wcf.brighthouse.com/channel-lineups-mobile/LineupRestService.svc/";
var sortBy = "channel";
var isdesc = true;

//--End Global Variables--


//----------------
//--Page Methods--
//----------------
$(document).ready(function () {
    $('#ZipCode').focus();

    if ($.cookie("BHNZipCode") != null) {
        $('#ZipCode').val($.cookie("BHNZipCode"));
        $('#Remember').val('on'); // .page();
    }

    $(this).keypress(function (e) {
        if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
            if ($('#Search').is(":visible")) {
                $('#SubmitButton').click();
            }
            return false;
        } else {
            return true;
        }
    });

    //use location services
//    if (navigator.geolocation && $('#ZipCode').val() == '') {
//        navigator.geolocation.getCurrentPosition(onSuccess, onError, { maximumAge: 600000, timeout: 10000 });
//        //navigator.geolocation.getCurrentPosition(onSuccess, onError, { timeout: 10000 });
//    }

});

// Success function for Geolocation call
function onSuccess(position) {
    //geonames.search(position.coords.latitude, position.coords.longitude);
    //alert(position.coords.latitude);
    //var safeLat = position.coords.latitude;
    //safeLat = safeLat.toString().split('.');
    //safeLat = safeLat[0];

    //http: //ws.geonames.org/findNearbyPostalCodesJSON?formatted=true&lat=28.62785917&lng=-81.38844698

    $.ajax({
        type: "GET",
        url: "http://ws.geonames.org/findNearbyPostalCodesJSON?formatted=true&lat=" + position.coords.latitude + "&lng=" + position.coords.longitude,
        cache: false,
        dataType: "json",
        timeout: 15000,
        success: function (data) {
            //            var postalcodes = $.parseJSON(data);
            //            alert(postalcodes);
            postalcodes = data.postalCodes;

            var locationZip;

            $.each(postalcodes, function (key, val) {
                $.each(val, function (key1, val1) {
                    if (key1 == "postalCode") {
                        locationZip = val1;
                        return (false);
                    }
                });
            });

            if (locationZip != null && locationZip != '') {
                $('#ZipCode').val(locationZip);
            }

        },
        error: function () {
            alert("Your location could not be discovered at this time. (servers were busy)");
        }

    });


}

// Error function for Geolocation call
function onError(msg) {
    alert('Your location could not be discovered at this time.');
}

function DisplayLineupSearchResults(data) {
    if (data != null && data != '') {
        var searchResults = '<h3>Results for ' + $('#ZipCode').val() + ' <a href="javascript:void(0);" onclick="ResetSearch();">(change)</a></h3>';
        var categories = data[0].Categories;

        //check for mutiple lineups
        if (categories.length > 0) {
            var pair = categories[0].split(',');
            if (pair[1] == "Multiple lineups") {

                searchResults += 'The ZIP code you entered is associated with more than one lineup.  Please select the correct lineup below: <br /><br />';
                for (var i = 1; i < categories.length; i++) {
                    var keyValuePair = categories[i].split(',');
                    searchResults += '<a href="javascript:void(0);" onclick="GetLineupResults(' + keyValuePair[0] + ')">' + keyValuePair[1] + '</a><br />';
                }

                searchResults += '</span>';

                searchResults += '</div>';

                $('#SearchResults').html(searchResults);
                $('#SearchResults').show();
                $('#Search').hide();
                $('#channelAnchor').append('<img src="images/desc.gif" style="display:inline" vspace="3" />');

            } else {
                //create category filter drop-down
                searchResults += '<div class="ui-select"><div class="ui-btn ui-btn-icon-right ui-btn-corner-all ui-shadow ui-btn-up-c" data-theme="c"><span class="ui-btn-inner ui-btn-corner-all"><span class="ui-btn-text" id="FilterName">-Filter Results-</span><span class="ui-icon ui-icon-arrow-d ui-icon-shadow"></span></span><select id="select-choice-1" name="select-choice-1" onchange="filterResults(this.value, $(\'#select-choice-1 :selected\').text());">';

                //add default 'no filter' option
                searchResults += '<option value="0">-Show All Categories-</option>';

                //add category options to drop-down
                for (var i = 0; i < categories.length; i++) {
                    var keyValuePair = categories[i].split(',');
                    searchResults += '<option value="' + keyValuePair[0] + '">' + keyValuePair[1] + '</option>';

                }
                //<option value="standard">Basic & Standard</option><option value="rush">Rush: 3 days</option><option value="express">Express: next day</option><option value="overnight">Overnight</option>

                //close category filter drop-down
                searchResults += '</select></div></div>';

                searchResults += '<div class="ui-grid-a" style="border-style:solid;border-width:1px;border-color:#aaaaaa;padding:1px;background-color:#ffffff">';
                searchResults += '<div class="ui-block-a" style="text-align:center;width:25%"><div class="ui-bar ui-bar-d"><strong><a href="#" onclick="sortUnorderedList(true)" id="channelAnchor">#</a></strong></div></div><div class="ui-block-b" style="width:75%"><div class="ui-bar ui-bar-d"><strong><a href="#" onclick="sortUnorderedList(false)" id="stationAnchor">Station</a></strong></div></div>';

                searchResults += '<span id="dataSection">';

                for (var j = 0; j < data.length; j++) {
                    searchResults += '<div class="cat-' + data[j].CategoryID + ' ui-block-y" style="width:25%">' + data[j].ChannelNumber + '</div><div class="cat-' + data[j].CategoryID + ' ui-block-z" style="width:75%">' + data[j].Station + '</div>';
                }

                searchResults += '</span>';

                searchResults += '</div>';

                $('#SearchResults').html(searchResults);
                $('#SearchResults').show();
                $('#Search').hide();
                $('#channelAnchor').append('<img src="images/desc.gif" style="display:inline" vspace="3" />');

            }
        }

        
    } else {
        $.mobile.hidePageLoadingMsg();
        alert("No channels matched your search criteria.");
    }
}

function filterResults(categoryID, categoryName) {
    if (categoryID > 0) {
        $("div[class^='cat-']").hide();
        $('.cat-' + categoryID).show();
        $('#FilterName').html(categoryName);
    } else {
        //show all
        $("div[class^='cat-']").show();
        $('#FilterName').html('-Filter Results-');
    }
}

function highlightText() {
    $('#DirectionsTo').focus();
    $('#DirectionsTo').select();
}

function ResetSearch() {
    $('#SearchResults').hide();
    $('#Search').show();
}

//--End Page Methods--


//-------------------
//--Service Methods--
//-------------------
function GetLineupSearchResults() {

    var searchText = 'undefined';

    //validate form
    if ($('#ZipCode').val() == '') {
        alert('Zip Code is required.');
        return false;
    } else if (!isNumber($('#ZipCode').val())) {
        alert('Zip Code must be numeric.');
        return false;
    }

    if ($('#SearchText').val() != '') {

        //TODO: remove special characters etc

        searchText = $('#SearchText').val();
    }

    //store zip if remember is on
    if ($('#Remember').val() == 'on') {
        $.cookie("BHNZipCode", $('#ZipCode').val(), { path: '/' });
    } else {
        //clear if off
    $.cookie("BHNZipCode", null, { path: '/' });
    }

    //show loading dialog
    $.mobile.showPageLoadingMsg();

    $.ajax({
        type: "GET",
        url: serviceAddress + "LineupSearch/" + $('#ZipCode').val() + "/" + searchText + "?jsoncallback=?",
        cache: false,
        timeout: 10000,
        dataType: "jsonp",
        success: function (data) {
            DisplayLineupSearchResults(data);
            $.mobile.hidePageLoadingMsg();
        },
        error: function () {
            $.mobile.hidePageLoadingMsg();
            alert("Channel search is not available at this time.  Please try again shortly.");
        }
    });


}

function GetLineupResults(lineupID) {

    var searchText = 'undefined';

    if ($('#SearchText').val() != '') {

        //TODO: remove special characters etc

        searchText = $('#SearchText').val();
    }

    //show loading dialog
    $.mobile.showPageLoadingMsg();

    $.ajax({
        type: "GET",
        url: serviceAddress + "LineupDisplay/" + lineupID + "/" + searchText + "?jsoncallback=?",
        cache: false,
        timeout: 10000,
        dataType: "jsonp",
        success: function (data) {
            DisplayLineupSearchResults(data);
            $.mobile.hidePageLoadingMsg();
        },
        error: function () {
            $.mobile.hidePageLoadingMsg();
            alert("Channel search is not available at this time.  Please try again shortly.");
        }
    });


}
//--End Service Methods--


//-------------------
//--Utility Methods--
//-------------------
function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

jQuery.cookie = function (name, value, options) {
    if (typeof value != 'undefined') { // name and value given, set cookie
        options = options || {};
        if (value === null) {
            value = '';
            options.expires = -1;
        }
        var expires = '';
        if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
            var date;
            if (typeof options.expires == 'number') {
                date = new Date();
                date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
            } else {
                date = options.expires;
            }
            expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
        }

        var path = options.path ? '; path=' + (options.path) : '';
        var domain = options.domain ? '; domain=' + (options.domain) : '';
        var secure = options.secure ? '; secure' : '';
        document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
    } else { // only name given, get cookie
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
};

function parseCookie(cookieValue) {
    var parsedValue;

    if (cookieValue == null) {
        //Return empty string.
        parsedValue = '';
    }
    else {
        parsedValue = cookieValue;
    }
    return parsedValue;
}

function sortUnorderedList(isChannel) {
    ul = document.getElementById("SearchResults");
    var channels = $('.ui-block-y');
    var stations = $('.ui-block-z');
    var lis = [];
    for (var i = 0, l = channels.length; i < l; i++) {
        lis.push({ "channel": channels[i],
            "station": stations[i]
        });
    }

    if (isChannel) {
        lis.sort(function (a, b) { return a.channel.innerHTML - b.channel.innerHTML });
    } else {
        lis.sort(function (a, b) { return a.station.innerHTML.toLowerCase() > b.station.innerHTML.toLowerCase() ? 1 : -1 });
    }

    if (isdesc) {
        if (isChannel) {

            $('#channelAnchor').text("#");
            $('#channelAnchor').append('<img src="images/asc.gif" style="display:inline" vspace="3" />');
            $('#stationAnchor').text("Station");
        } else {
            $('#stationAnchor').text("Station");
            $('#stationAnchor').append('<img src="images/asc.gif" style="display:inline" vspace="3" />');
            $('#channelAnchor').text("#");
        }
        lis.reverse();
        isdesc = false;
    } else {
        if (isChannel) {
            $('#channelAnchor').text("#");
            $('#channelAnchor').append('<img src="images/desc.gif" style="display:inline" vspace="3" />');
            $('#stationAnchor').text("Station");
        } else {
            $('#stationAnchor').text("Station");
            $('#stationAnchor').append('<img src="images/desc.gif" style="display:inline" vspace="3" />');
            $('#channelAnchor').text("#");
        }
        isdesc = true;
    }

    $('div .ui-block-y').remove();
    $('div .ui-block-z').remove();
    
    for (var i = 0, l = lis.length; i < l; i++) {
        channels[i] = lis[i].channel;
        stations[i] = lis[i].station;
        $('#dataSection').append(channels[i]);
        $('#dataSection').append(stations[i]);
    }

    

}
//--End Utility Methods--