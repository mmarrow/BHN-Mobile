// DoubleClick.js re-implementation since Joe Harmer noticed that DoubleClick 
// hadn't been working anymore.

var DoubleClick = DoubleClick || {};
DoubleClick = {
    num : ( function(x) {
            return Math.floor((x + "") * 10000000000000);
        }(Math.random())),

    recordEvent : function(link) {
        // Only record phone number events
        if (link.toString().indexOf('tel:') == 0) {
            var iframe = document.createElement('iframe');
            iframe.src = this.URLForLink(link);
            iframe.width="1";
            iframe.height="1";
            iframe.style="display:none; border:0px;";
            var body = document.getElementsByTagName('body')[0];
            body.appendChild(iframe);
        }
        return false;
    },

    URLForLink : function(link) {
        var currentPage = document.location.pathname;
        var source = this.analyticsURLs()[currentPage] || '';
        var protocol = document.location.protocol;
        source = protocol + source;
        return source;
    },

    analyticsURLs : function() {
        var urls = [];
        urls["/offers.html"]         = '//3680673.fls.doubleclick.net/activityi;src=3680673;type=resid797;cat=resid767;ord=1;num=' + this.num + '?';
        urls["/offers/offer-1.html"] = '//3680673.fls.doubleclick.net/activityi;src=3680673;type=tripl202;cat=tripl816;ord=1;num=' + this.num + '?';
        urls["/offers/offer-2.html"] = '//3680673.fls.doubleclick.net/activityi;src=3680673;type=doubl588;cat=doubl057;ord=1;num=' + this.num + '?';
        urls["/offers/offer-3.html"] = '//3680673.fls.doubleclick.net/activityi;src=3680673;type=doubl317;cat=doubl051;ord=1;num=' + this.num + '?';
        return urls;
    },
};
