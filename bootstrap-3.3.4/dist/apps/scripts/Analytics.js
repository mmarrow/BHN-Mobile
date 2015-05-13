function Analytics(category) {
    this.category = category;
    var topButton = document.getElementById('callusbtntop');
    topButton.addEventListener('click', this, false);
    var bottomButton = document.getElementById('callusbtnbottom');
    bottomButton.addEventListener('click', this, false);
    var viewFullSiteButton = document.getElementById('viewfull');
    viewFullSiteButton.addEventListener('click', this, false);
}

Analytics.prototype = {
    constructor : Analytics,

    handleEvent : function(evt) {
        if (evt.type == 'click') {
            // Delay following the link for 1 second, so the analytics have a chance to run.
            
            evt.preventDefault ? evt.preventDefault() : (evt.returnValue = false);
            var href = evt.currentTarget.href;

            this.recordEventInCategory(evt.currentTarget, this.category);
            setTimeout(function(){
                window.location.href = href;
            }, 1000);
        }
    },

    recordEventInCategory : function(link, category) {
        this.recordGoogleAnalyticsEvent(link, category);
        // this.recordEventForLink(link); No image-based on-click analytics currently. 
        
        // scripts.DoubleClick.js
        if (typeof DoubleClick === 'object') {
            DoubleClick.recordEvent(link);
        }

    },

    recordGoogleAnalyticsEvent : function(link, category) {
        var label = document.location.pathname;
        _gaq.push(['_trackEvent', category, link, label]);
    },

    recordEventForLink : function(link) {
        var url = this.imageURLForLink(link);

        if (url.length > 0) {
            // These analytics are tracked by loading a specific one-pixel image
            var img = document.createElement('img');
            img.src = url;
            img.height = 1;
            img.width = 1;
            var body = document.getElementsByTagName('body')[0];
            body.appendChild(img);
        }
    },

    imageURLForLink : function(link) {
        var currentPage = document.location.pathname;
        var source = this.analyticsURLs()[currentPage] || '';
        return source;
    },

    analyticsURLs : function() {
        var urls = [];
        urls["/offers.html"] = "";
        urls["/offers/offer-1.html"] = "";
        urls["/offers/offer-2.html"] = "";
        urls["/offers/offer-3.html"] = "";
        return urls;
    },
}

