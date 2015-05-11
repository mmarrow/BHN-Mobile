
//--------------------
//--Global Variables--
//--------------------
var divisionName;
var serviceAddress = "https://wcf.brighthouse.com/locations-mobile/LocationsRestService.svc/";
var divisionID;
var map;
var locations;
var currentMarkers = new Array();
var searchLatLng;
var searchAddress;
var defaultLat;
var defaultLng;
var defaultZoom;
var isCounty = false;
var directionDisplay;
var directionsService = new google.maps.DirectionsService();
var activeMarker;
var attempts = 0;
var detectedZip;
var detectedCounty;
//--End Global Variables--


//----------------
//--Page Methods--
//----------------
$(document).ready(function () {
    //for stage/prod
    //    divisionName = parseCookie($.cookie("divisionid"));
    //    if (divisionName.length == 0 || divisionName == "ENU") {
    //        $.forceLocalization();
    //    } else {
    //        DisplayDefaultContent();
    //    }

    $('#Loading').hide();
    $('#RegionLabel').show();

    $('input:checkbox').change(function () {
        SelectChanged();
    });

    if ($('#SelectDivision').val() != '') {
        RegionChanged();
    }

    //check for market cookie
    if ($.cookie("BHNMarket") != null) {
        $('#SelectDivision').val($.cookie("BHNMarket"))
        //$('#SelectDivision').selectmenu('refresh', true)
        RegionChanged();
    }

    //$.cookie("LocationSearches", null);

    //default search button to fire on enter keypress
    $(this).keypress(function (e) {
        if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
            if ($('#SearchButton').is(":visible")) {
                PerformSearch();
            }
            if ($('#ButtonRoute').is(":visible")) {
                $('#ButtonRoute').click();
            }
            return false;
        } else {
            return true;
        }
    });

    //    var TO = false;
    //    $(window).resize(function () {
    //        if ($('#DefaultContent').is(':visible')) {

    //            if (TO !== false)
    //                clearTimeout(TO);
    //            TO = setTimeout(GetData, 300);
    //        }
    //    });

});


function getLocation() {
    //use location services
    if (detectedZip == undefined) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(onSuccess, onError, { timeout: 10000 });
        }
    } else {
        alert("Your location has already been detected as: " + detectedZip + " (" + detectedCounty + ")");
    }
}

// Success function for Geolocation call
function onSuccess(position) {
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

            var locationCounty;
            var locationZip;

            $.each(postalcodes, function (key, val) {
                $.each(val, function (key1, val1) {
                    if (key1 == "adminName2") {
                        locationCounty = val1;
                    }
                    if (key1 == "postalCode") {
                        locationZip = val1;
                        return (false);
                    }
                });
            });

            if (locationZip != null && locationZip != '' && locationCounty != null) {
                //$('#ZipCode').val(locationZip);
                detectedZip = locationZip;
                detectedCounty = locationCounty;
                $('#Detected').html("&nbsp; Detected location: " + locationZip + " (" + locationCounty + ")");
                $('#Detected').show();
                if ($('#TextBoxAddress').val() == '' && $('#AddressRequired').is(":visible")) {
                    $('#TextBoxAddress').val(locationZip)
                } else {
                    //attempt to select correct county
                    //$('#SelectCounty').val(locationCounty);

                    $("#SelectCounty").find("option:contains('" + locationCounty + "')").each(function () {
                        if ($(this).text() == locationCounty) {
                            $(this).attr("selected", "selected");
                        }
                    });

                    $('#SelectCounty').selectmenu('refresh', true)
                }
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




function RecentSearchesChanged() {
    if ($('#RecentSearches').val() != "-Recent Searches-") {
        $('#TextBoxAddress').val($('#RecentSearches').val());
    } else {
        $('#TextBoxAddress').val('');
    }
}

function LoadRecentSearches() {
    if ($.cookie("BHNZipCode") != null) {
        $('#TextBoxAddress').val($.cookie("BHNZipCode"));
    }


    if ($.cookie("LocationSearches") != null) {
        $('#RecentSearches').children('option:not(:first)').remove();

        var recents = $.cookie("LocationSearches").split('|');

        if (recents != null) {
            $.each(recents, function (val, text) {
                $('#RecentSearches').append(
                    $('<option></option>').val(text).html(text)
                );
            });
        }
    }
}

function DisplayView(view) {
    switch (view) {
        case "results":
            $('#SearchResults').show();
            $('#directionsPanel').hide();
            $('#DirectionsMap').hide();
            $('#directionsPanel').html('');
            $('#Map').show();
            $('#DefaultContent').hide();
            UpdatedSelectedLocation(activeMarker);
            $('#Loading').hide();
            $('#directionsPanel').css('height', '250');
            //$('#ApplicationContainer').css('height', '100%');
            break;
        case "directions":
            $('#SearchResults').hide();
            $('#directionsPanel').show();
            $('#DirectionsMap').show();
            $('#directionsPanel').html('');
            $('#Map').hide();
            $('#DefaultContent').hide();
            $('#Loading').hide();
            break;
        default:
            $('#SearchResults').hide();
            $('#directionsPanel').hide();
            $('#DirectionsMap').hide();
            $('#directionsPanel').html('');
            $('#Map').hide();
            $('#DefaultContent').show();
            $('#Loading').hide();
            break;
    }
}

function calcRoute(start, end) {
    $.mobile.showPageLoadingMsg();
    DisplayView("directions");

    directionsDisplay = new google.maps.DirectionsRenderer();
    var myOptions = {
                zoom: 7,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                draggable: false
    }

    dm = new google.maps.Map(document.getElementById("DirectionsMap"), myOptions);
    directionsDisplay.setMap(dm);
    directionsDisplay.setPanel(document.getElementById("directionsPanel"));

    var request = {
        origin: start,
        destination: end,
        travelMode: google.maps.DirectionsTravelMode.DRIVING
    };
    directionsService.route(request, function (response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            $.mobile.hidePageLoadingMsg();
            directionsDisplay.setDirections(response);
            view = "results";
//            if (start == end) {
                temp = "updateRoute('" + end + "');";
                inputControl = '<br /><span class="Hint">Please enter your current location for Address A below, then click the route button for driving directions.</span><br /><fieldset data-role="controlgroup" style="padding-left:4px;padding-right:4px"><label for="DirectionsTo">Address A:</label><input name="DirectionsTo" id="DirectionsTo" type="text" value="' + start + '" /><a id="ButtonRoute" data-role="button" href="javascript:void(0);" onclick="' + temp + '">Route</a></fieldset><br clear="all" />';
                $('#directionsPanel').html("<a href='javascript:DisplayView(\"" + view + "\");' data-role='button' data-icon='arrow-l'>Back to search results</a>" + inputControl).page();
//            } else {
//                $('#directionsPanel').html("<a href='javascript:DisplayView(\"" + view + "\");' data-role='button' data-icon='arrow-l'>Back to search results</a>" + $('#directionsPanel').html()).page();
//            }
        } else {
            $.mobile.hidePageLoadingMsg();
        }
        $("div[data-role=page]").page("destroy").page();
    });
    window.setTimeout(highlightText, 400);
}

function updateRoute(end) {
    $.mobile.showPageLoadingMsg();
    start = $('#DirectionsTo').val();
    DisplayView("directions");

    directionsDisplay = new google.maps.DirectionsRenderer();
    var myOptions = {
        zoom: 7,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        draggable: false
    }

    dm = new google.maps.Map(document.getElementById("DirectionsMap"), myOptions);
    directionsDisplay.setMap(dm);
    directionsDisplay.setPanel(document.getElementById("directionsPanel"));

    var request = {
        origin: start,
        destination: end,
        travelMode: google.maps.DirectionsTravelMode.DRIVING
    };
    directionsService.route(request, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            $.mobile.hidePageLoadingMsg();
            directionsDisplay.setDirections(response);
            view = "results";
            temp = "updateRoute('" + end + "');";
            inputControl = '<br /><fieldset data-role="controlgroup" style="padding-left:4px;padding-right:4px"><label for="DirectionsTo">Address A:</label><input name="DirectionsTo" id="DirectionsTo" type="text" value="' + start + '" /><a id="ButtonRoute" data-role="button" href="javascript:void(0);" onclick="' + temp + '">Route</a></fieldset><br clear="all" /><a id="ButtonAppDirections" data-role="button" href="http://maps.google.com/maps?daddr=' + end + '&saddr=' + start + '">View in Map Application</a>';
            $('#directionsPanel').html("<a href='javascript:DisplayView(\"" + view + "\");' data-role='button' data-icon='arrow-l'>Back to search results</a>" + inputControl).page();
        } else {
            $.mobile.hidePageLoadingMsg();
            alert('Please specify a complete street address.');
            temp = "updateRoute('" + end + "');";
            inputControl = '<br /><span class="Hint">Please enter your current location for Address A below, then click the route button for driving directions.</span><br /><table border="0" cellpadding="0" cellspacing="0"><tr><td>Address A: <input id="DirectionsTo" type="text" style="width:200px;height:25px;font-size:14px" value="' + start + '" /></td><td><a id="ButtonRoute" class="button" style="margin-top:0px" href="javascript:void(0);" onclick="' + temp + '"><span>Route</span></a></td></tr></table><br clear="all" />';
            $('#directionsPanel').html("<a href='javascript:DisplayView(\"" + view + "\");' data-role='button' data-icon='arrow-l'>Back to search results</a>" + inputControl).page();
        }
        $("div[data-role=page]").page("destroy").page();
    });
}

function printDirections() {

    $('#directionsPanel').css('height', 'auto');
    $('#ApplicationContainer').css('height', 'auto');
    window.print();
}

function highlightText() {
    $('#DirectionsTo').focus();
    $('#DirectionsTo').select();
}

function DisplayDefaultContent() {
    LoadRecentSearches();
    AdjustSearchCriteria();
    GetData();

}

function Initialize(lat, lng, zoom) {
    defaultLat = lat;
    defaultLng = lng;
    defaultZoom = zoom;

    var mapCenter = new google.maps.LatLng(defaultLat, defaultLng);
    map = new google.maps.Map(document.getElementById("Map"), {
        'center': mapCenter,
        'zoom': defaultZoom,
        'center': mapCenter,
        'minZoom': 7,
        'draggable': false,
        'mapTypeId': google.maps.MapTypeId.ROADMAP
    });

}

function GeocodeAddress(address) {

    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 'address': address }, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            searchAddress = address;
            searchLatLng = results[0].geometry.location; //  new google.maps.LatLng(point.lat(), point.lng());
        } else {
            alert('The address you entered could not be found.');
        }
    });
}

function ClearLocations(orderproducts, makepayment, demoproducts, exchangeequipment, customerservice) {
    return (!orderproducts && !makepayment && !demoproducts && !exchangeequipment && !customerservice) ? true : false;
}

function CreateMarker(location, index, isNumberedIcon) {

    var latLng = new google.maps.LatLng(parseFloat(location.lat), parseFloat(location.lng));
    //var markerOptions = null;
    var marker = null;

    if (isNumberedIcon) { //search was completed so we display numbered icons instead of generic markers

        var image = "Assets/Markers/marker" + (index + 1) + ".png";
        var numberedIcon = new google.maps.Marker({
            position: latLng,
            map: map,
            icon: image,
            title: location.name
        });

        marker = numberedIcon;
    }
    else {
        var normalIcon = new google.maps.Marker({
            position: latLng,
            map: map,
            title: location.name
        });

        marker = normalIcon;
    }


    var infoWindow = new google.maps.InfoWindow({ content: GetInfoWindowHTML(index) });

    google.maps.event.addListener(marker, 'click', function () {
        infoWindow.open(map, marker);
    });

    return marker;
}

function DisplayDivisionMarkers(jsonObj, autoAdjustMap, orderproducts, makepayment, demoproducts, exchangeequipment, customerservice) { 

    locations = jsonObj;

    if (ClearLocations(orderproducts, makepayment, demoproducts, exchangeequipment, customerservice)) {
        locations = '';
    } else {
        //display only locations requested by the user
        for (var j = 0; j < locations.length; j++) {
            try {
                if (orderproducts && !locations[j].order_products) { locations.splice(j, 1); j--; }
                if (makepayment && !locations[j].make_payment) { locations.splice(j, 1); j--; }
                if (demoproducts && !locations[j].demo_products) { locations.splice(j, 1); j--; }
                if (exchangeequipment && !locations[j].exchange_equipment) { locations.splice(j, 1); j--; }
                if (customerservice && !locations[j].customer_service) { locations.splice(j, 1); j--; }
            } catch (err) {
                //alert(j + " " + err.description);
            }
        }
    }

    //$('#LocationCount').html(locations.length + " locations matched your criteria");

    clearOverlays();
    
    currentMarkers = currentMarkers.slice(0, currentMarkers.length);

    for (var i = 0; i < locations.length; i++) {
        var marker = CreateMarker(locations[i], i, (autoAdjustMap) ? true : false);
        currentMarkers[i] = marker;
        marker.setMap(map);
        //map.addOverlay(marker);
    }

    if (autoAdjustMap) {
        if (locations.length < 1) {
            alert('No locations were found for ' + searchAddress);
            DisplayDefaultContent();
            return;
        }

        var latlng1 = new google.maps.LatLng(locations[0].lat, locations[0].lng);
        var latlng2 = new google.maps.LatLng(locations[locations.length - 1].lat, locations[locations.length - 1].lng);

        if (!isCounty) {
            DisplayOriginMarker(searchLatLng.y, searchLatLng.x, searchAddress);
        }
        
        searchLatLng = new google.maps.LatLng(defaultLat, defaultLng);

        var bounds1 = new google.maps.LatLngBounds();
        bounds1.extend(searchLatLng);
        bounds1.extend(latlng1);
        bounds1.extend(latlng2);

        var bounds2 = new google.maps.LatLngBounds(bounds1.getSouthWest(), bounds1.getNorthEast());
        //map.setCenter(latlng1, map.getBoundsZoomLevel(bounds2) - 1);

        if (locations.length == 1) {
            map.setZoom(12);
        }

        var listings = "<span class=\"SearchResultsHeader\">" + locations.length + " locations found for '" + searchAddress + "' <a href='javascript:DisplayDefaultContent()'>(Change)</a></span>";
        listings += '<hr class="hr" />';

        //append each result to the side menu
        for (var i = 0; i < locations.length; i++) {
            if (locations[i].distance > 0) {
                listings += '<span class="SearchResults" style="float:right">' + locations[i].distance.toFixed(2) + '</span>';
            }
            listings += '<div id="Result' + i + '" onclick="UpdatedSelectedLocation(' + i + ');"><span class="SearchResults">' + (i + 1) + ' &nbsp;' + locations[i].name + '</span>';
            listings += '<br /><div class="SearchDetails">' + locations[i].street + '<br />' + locations[i].city_state_zip_county;
            listings += '<br />Hours: ' + locations[i].weekday_hours + '<br />' + locations[i].weekend_hours;
            if (!isCounty) {
                tempAddress = locations[i].street + ' ' + locations[i].city_state_zip_county;
                //                temp = "javascript:GetDirections('to', '" + tempAddress + "')";
                //                listings += '<br /><a href="' + temp + '">Drive To</a> |';
                //                temp = "javascript:GetDirections('from', '" + tempAddress + "')";
                //                listings += ' <a href="' + temp + '">Drive From</a>';
                temp = "javascript:calcRoute('" + searchAddress + "', '" + tempAddress + "')";
                listings += '<br /><a href="' + temp + '">Drive To</a>';
                temp = "javascript:calcRoute('" + tempAddress + "', '" + searchAddress + "')";
                listings += ' | <a href="' + temp + '">Drive From</a>';
            } else {
                tempAddress = locations[i].street + ' ' + locations[i].city_state_zip_county;
                if ($.cookie("BHNZipCode") != null) {
                    temp = "javascript:calcRoute('" + $.cookie("BHNZipCode") + "', '" + tempAddress + "')";
                } else {
                    temp = "javascript:calcRoute('" + tempAddress + "', '" + tempAddress + "')";
                }
                listings += '<br /><a href="' + temp + '">Get Directions</a> | <a href="http://maps.google.com/?q=loc:' + tempAddress +'">View in Map App</a>';

                //<a href="http://maps.google.co.uk/?q=loc:OxfordSt,+Westminster,+LondonW1&sll=51.514958,-0.144463">test</a>
            }
            listings += '</div></div><hr class="hr" />';
        }

        $('#SearchResults').html(listings);
        DisplayView("results");
    }
}

function DisplayOriginMarker(lat, lng, zip) {

    var image = "Assets/Markers/star.png";
    var point = new google.maps.LatLng(lat, lng);
    var marker = new google.maps.Marker({
        position: point,
        map: map,
        icon: image,
        title: zip
    });

    marker.setMap(map);

}

function ResetSearch() {

    DisplayView();
    map.setCenter(new google.maps.LatLng(defaultLat, defaultLng), defaultZoom);
}

function GetDirections(direction, address) {

    var startAddress = (direction == "to") ? searchAddress : address;
    var endAddress = (direction == "to") ? address : searchAddress;
    var directionsURL = "http://maps.google.com/maps?saddr=" + startAddress + "&daddr=" + endAddress;
    var newWindow = window.open(directionsURL);

}

function GetInfoWindowHTML(markerIndex) {
    
    var location = locations[markerIndex];

    var htmlString = "<h5 class='default'>" + location.name + "</h5>";
    htmlString += "<div class='SearchDetails'>" + location.street + "<br />";
    htmlString += location.city_state_zip_county + "<br />";
    if (location.phone != "" && location.phone != "N/A" && location.phone != " ") {
        htmlString += "<span class='sub-header'>Phone: </span>" + location.phone + "<br />";
    }
    htmlString += "<span class='sub-header'>Hours:</span> " + location.weekday_hours + "<br />";
    if (location.weekend_hours != "N/A") {
        htmlString += "<div style='margin-left:45px'>" + location.weekend_hours + "</div></div>";
    }
    if (location.name.substring(0, 4) == "Vcom") {
        htmlString += "<span class='sub-header'>Service Charge:</span> The ChoicePay fee is $3.00 and is charged to customers per transaction.<br />";
    }
    //htmlString += "<div style='text-align: center'><img src='http://applications.brighthouse.com/LocationsMap/Assets/LocationImages/" + location.img + "' width='186' height='70' /></div>";

    return htmlString;

}

function UpdatedSelectedLocation(index) {

    if (index != null) {
        currentMarkers[index].openInfoWindow(GetInfoWindowHTML(index), { maxWidth: 250 });
        $('[id^=Result]').css('background-color', "#eeeeee");
        $('#Result' + index).css('background-color', "#ffffff");
        activeMarker = index;
    }
}

function PopulateCounties(jsonObj) {
    counties = jsonObj;

    if (counties != null) {
        $('#SelectCounty').children('option:not(:first)').remove();

        $.each(counties, function (val, text) {
            if (text.Name != "Default") {
                $('#SelectCounty').append(
               $('<option></option>').val(text.CountyID).html(text.Name)
            );
            }
        });
        $('#SelectCounty').selectmenu('refresh', true)
    }

    if (counties.length < 2) {
        $('#SelectCounty option:second').attr('selected', 'selected');
        //$('#CountyRequired').hide();
    }

}

function RegionChanged() {
    $.cookie("BHNMarket", $('#SelectDivision').val(), { path: '/' });
    $('#RegionLabel').hide();
    divisionName = $('#SelectDivision').val();
    $('#SelectCounty').children('option:not(:first)').remove();
    GetDivisionID();
    $('#SelectDivision option:contains("-Select a Region-")').remove();
    AdjustSearchCriteria();
    LoadRecentSearches();
    DisplayView();
}


function SelectChanged() {
    AdjustSearchCriteria();
    DisplayView();
}

function AdjustSearchCriteria() {
    if ($('#MakePayment').attr('checked') || $('#OrderProducts').attr('checked') || $('#ExchangeEquipment').attr('checked')) {
        $('#AddressRequired').hide();
        $('#TextBoxAddress').val('');
        if ($('#SelectCounty option').size() > 2) {
            $('#CountyRequired').show();
        } else {
            $('#CountyRequired').show();
            // $('#SelectCounty option:second').attr('selected', 'selected');
        }
    } else {
        $('#CountyRequired').hide();
        $('#SelectCounty option:first-child').attr('selected', 'selected');
        $('#AddressRequired').show();
    }
}


function HandleSearchError(msg, msgTitle) {

    new Overlay("<p>" + msg + "</p>", { type: "error", title: msgTitle })

}
//--End Page Methods--


//-------------------
//--Service Methods--
//-------------------
function GetDivisionID() {
    $.ajax({
        type: "GET",
        url: serviceAddress + "GetDivisionLocation/" + divisionName + "?jsoncallback=?",
        cache: false,
        timeout: 15000,
        dataType: "jsonp",
        success: function (data) {
            divisionID = data.DivisionID;
            LoadCounties();
        },
        //the error method seems to be unavailable until jquery 1.5
        error: function () {
            $('#Loading').html('<br /><br />Locations Map service is currently unavailable.  Please try again later.');
        }
    });

    //until jquery 1.5 is adopted for this application, check manually to ensure data has returned
    if (divisionID == null) {
        if (attempts < 3) {
            attempts++;
            window.setTimeout(Wait, 8000);
        }
    }

}



function GetData() {
    $.ajax({
        type: "GET",
        url: serviceAddress + "GetDivisionLocation/" + divisionName + "?jsoncallback=?",
        cache: false,
        timeout: 15000,
        dataType: "jsonp",
        success: function(data) {
            divisionID = data.DivisionID;
            Initialize(data.Lat, data.Lng, data.Zoom);
            DisplayView();
        },
        //the error method seems to be unavailable until jquery 1.5
        error: function() {
//            if (attempts < 3) {
//                attempts++;
//                window.setTimeout(Wait, 8000);
//            } else {
                $('#Loading').html('<br /><br />Locations Map service is currently unavailable.  Please try again later.');
//            }
        }
    });

    //until jquery 1.5 is adopted for this application, check manually to ensure data has returned
    if (divisionID == null) {
        if (attempts < 3) {
            attempts++;
            window.setTimeout(Wait, 8000);
        }
    }
    
}

function DisplayPins() {
    $.ajax({
        type: "GET",
        url: serviceAddress + "GetDivisionPins/" + divisionName + "?jsoncallback=?",
        cache: false,
        dataType: "jsonp",
        timeout: 15000,
        success: function (data) {
            DisplayDivisionMarkers(data, false, $('#OrderProducts').attr('checked'), $('#MakePayment').attr('checked'), $('#DemoProducts').attr('checked'), $('#ExchangeEquipment').attr('checked'), $('#CustomerService').attr('checked'));
        }
    });
}

function LoadCounties() {
    $.ajax({
        type: "GET",
        url: serviceAddress + "GetCounties/" + divisionID + "?jsoncallback=?",
        cache: false,
        dataType: "jsonp",
        timeout: 15000,
        success: function (data) {
            PopulateCounties(data);
        }
    });
}

function PerformSearch() {
    $('#Map').show();
    
    $.ajax({
        type: "GET",
        url: serviceAddress + "GetDivisionLocation/" + divisionName + "?jsoncallback=?",
        cache: false,
        timeout: 15000,
        dataType: "jsonp",
        success: function (data) {
            divisionID = data.DivisionID;
            Initialize(data.Lat, data.Lng, data.Zoom);
        },

        error: function () {
            $('#Loading').html('<br /><br />Locations Map service is currently unavailable.  Please try again later.');
        }
    });

    $.mobile.showPageLoadingMsg();
    activeMarker = null;
    if ($('#SelectCounty').val() != "0") {
        searchAddress = $('#SelectCounty option:selected').text() + " county";
        isCounty = true;

        $.ajax({
            type: "GET",
            url: serviceAddress + "GetSearchResultsByCounty/" + $('#SelectCounty').val() + "?jsoncallback=?",
            cache: false,
            dataType: "jsonp",
            timeout: 15000,
            success: function (data) {
                DisplayDivisionMarkers(data, true, $('#OrderProducts').attr('checked'), $('#MakePayment').attr('checked'), $('#DemoProducts').attr('checked'), $('#ExchangeEquipment').attr('checked'), $('#CustomerService').attr('checked'));
                $.mobile.hidePageLoadingMsg();
            },
            error: function() {
                alert("Locations Map search is temporarily unavailable.  Please try again later.");
                $.mobile.hidePageLoadingMsg();
            }
        });

    } else {
        //attempt address search
        if ($('#TextBoxAddress').val() != '') {
            //add search criteria to Recent Search cookie
            var previous = $.cookie("LocationSearches");

            if (previous != null) {
                if(previous.indexOf($('#TextBoxAddress').val()) == -1) {
                    //append
                    previous = $('#TextBoxAddress').val() + '|' + previous;
                    $.cookie("LocationSearches", previous, { expires: 365 });
                }
            } else {
                //create
                $.cookie("LocationSearches", $('#TextBoxAddress').val(), { expires: 365 });
            }

            GeocodeAddress($('#TextBoxAddress').val());
            window.setTimeout(DisplayAdressSearchResults, 400);

        } else {
            alert('You must specify search criteria before clicking the search button.');
            $.mobile.hidePageLoadingMsg();
            $('#Map').hide();
        }
    }
}

function DisplayAdressSearchResults() {
    $.mobile.showPageLoadingMsg();
    isCounty = false;

    $.ajax({
        type: "GET",
        url: serviceAddress + "GetSearchResultsByAddress/" + divisionName + "/" + $('#SelectDistance').val() + "/" + searchLatLng.lat().toString().replace('.', 'P') + "/" + searchLatLng.lng().toString().replace('.', 'P') + "?jsoncallback=?",
        cache: false,
        dataType: "jsonp",
        timeout: 15000,
        success: function (data) {
            DisplayDivisionMarkers(data, true, $('#OrderProducts').attr('checked'), $('#MakePayment').attr('checked'), $('#DemoProducts').attr('checked'), $('#ExchangeEquipment').attr('checked'), $('#CustomerService').attr('checked'));
            $.mobile.hidePageLoadingMsg();
        },
        error: function () {
            alert("Locations Map search is temporarily unavailable.  Please try again later.");
            $.mobile.hidePageLoadingMsg();
        }
    });
}
//--End Service Methods--


//-------------------
//--Utility Methods--
//-------------------
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
        if (cookieValue.indexOf("rdecookie", 0) < 0) {
            //This is the same rule that is on Delivery Server to detect.
            parsedValue = cookieValue;
        }
        else {
            //Grabs everything after the rdecookie stuff, replaces some escaped characters.
            parsedValue = cookieValue.substring(49).replace(".3", "").replace(".20", " ");
        }

    }
    return parsedValue;
}

function Wait() {
    if (attempts < 3) {
        attempts++;
        window.setTimeout(Wait, 8000);
    } else {
        $('#Loading').html('<br /><br />The Locations Map is currently unavailable.  Please try again later.');
    }
}


function clearOverlays() {
    for (var i = 0; i < currentMarkers.length; i++) {
        currentMarkers[i].setMap(null);
    }
    currentMarkers = [];
}
//--End Utility Methods--