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

function convertPath(divisionName) {
    var path = "";
    switch (divisionName) {
        case "BAK":
            path = "/bakersfield/";
            break;
        case "BHM":
            path = "/birmingham/";
            break;
        case "CFL":
            path = "/central-florida/";
            break;
        case "CFL":
            path = "/central-florida/";
            break;
        case "ELM":
            path = "/fl-al/";
            break;
        case "EUF":
            path = "/fl-al/";
            break;
        case "MIC":
            path = "/michigan/";
            break;
        case "PAN":
            path = "/fl-al/";
            break;
        case "INY":
            path = "/indianapolis/";
            break;
        case "TPA":
            path = "/tampa-bay/";
            break;
    }

    return path;
}