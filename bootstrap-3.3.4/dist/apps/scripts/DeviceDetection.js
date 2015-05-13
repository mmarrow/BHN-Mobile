
/*

DeviceDetection.js
==============================

Used to display content specific to mobile devices

For android specific contnet add class="mobile-android"
For iOS specific content add class="mobile-ios"
For displaying conten when no supported deviced are detected use class="mobile-other"

*/


//$(window).ready(function () {

//    DetectMobileDevice();

//});

//add global variable for later use
var DetectedOS;


function DetectMobileDevice() {

    HideAll();

    if (navigator.userAgent.match(/Android/i)) {

        //Show Marketplace android links
        ShowandroidMarketPlace();
        DetectedOS = "android";

    }
    else if (navigator.userAgent.match(/iphone|ipad|ipod/i)) {

        //Show App Store Links
        ShowAppleAppStore();
        DetectedOS = "ios";

    }
    //For Desktop Testing - using chrome or safari
    else if (navigator.userAgent.match(/WebKit/i)) { 
        ShowAppleAppStore();
    }
    else {

        ShowOther();
    }
}


function HideAll() {

    $(".mobile-ios").hide();
    $(".mobile-android").hide();
    $(".mobile-other").hide();

}

function ShowandroidMarketPlace() {

    $(".mobile-android").show();

}

function ShowAppleAppStore() {

    $(".mobile-ios").show();
}


function ShowOther() {

    $(".mobile-other").show();
}
