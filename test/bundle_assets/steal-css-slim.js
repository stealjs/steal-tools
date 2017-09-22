/* naive version of the css plugin for the slim loader */
module.exports = function(moduleId, config) {
    return new CssModule(config.paths[config.bundles[moduleId]]).injectLink();
};

function CssModule(address) {
    this.address = address;
}

// timeout in seconds
CssModule.waitTimeout = 60;

CssModule.prototype.linkExists = function() {
    var styleSheets = document.styleSheets;
    var anchor = document.createElement("a");
    anchor.href = this.address;
    var href = anchor.href;

    for (var i = 0; i < styleSheets.length; ++i) {
        if (href === styleSheets[i].href) {
            return true;
        }
    }

    return false;
};

CssModule.prototype.injectLink = function() {
    if (this._loadPromise) {
        return this._loadPromise;
    }

    if (this.linkExists()) {
        this._loadPromise = Promise.resolve("");
        return this._loadPromise;
    }

    // inspired by https://github.com/filamentgroup/loadCSS
    var link = (this.link = document.createElement("link"));
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = this.address;

    // wait until the css file is loaded
    this._loadPromise = new Promise(function(resolve, reject) {
        var timeout = setTimeout(function() {
            reject("Unable to load CSS");
        }, CssModule.waitTimeout * 1000);

        var linkEventCallback = function(event) {
            clearTimeout(timeout);

            link.removeEventListener("load", linkEventCallback);
            link.removeEventListener("error", linkEventCallback);

            if (event && event.type === "error") {
                reject("Unable to load CSS");
            } else {
                resolve("");
            }
        };

        link.addEventListener("load", linkEventCallback);
        link.addEventListener("error", linkEventCallback);

        document.head.appendChild(link);
    });

    return this._loadPromise;
};