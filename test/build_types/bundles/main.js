/*bundlesConfig*/
System.bundles = {"bundles/main":["stealconfig","steal/css","main"],"bundles/main.css!":["main.css!steal/css"]};
/*stealconfig*/

/*steal/css*/
define('steal/css', function(require, exports, module) {if( steal.config('env') === 'production' ) {
	  exports.fetch = function(load) {
	    // return a thenable for fetching (as per specification)
	    // alternatively return new Promise(function(resolve, reject) { ... })
	    var cssFile = load.address;
	
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssFile;

        document.head.appendChild(link);
        return "";
	  };
} else {
	exports.instantiate = function(load) {
    
	    return {
				deps: [],
				execute: function(){
					if(load.source) {
						var head = document.head || document.getElementsByTagName('head')[0],
							style = document.createElement('style'),
							source = load.source+"/*# sourceURL="+load.address+" */";
					
						// make source load relative to the current page
						source = source.replace(/url\(['"]?([^'"\)]*)['"]?\)/g, function( whole, part ) {
							return "url(" + steal.joinURIs( load.address, part) + ")";
						});
						style.type = 'text/css';
						
						if (style.styleSheet){
						  style.styleSheet.cssText = source;
						} else {
						  style.appendChild(document.createTextNode(source));
						}
						head.appendChild(style);
					}
					
					return new System.global.Module({});
			}
		};
	};
}



exports.buildType = "css";
exports.includeInBuild = true;});
/*main*/
define('main', ['main.css!'], function ($__0) {
    'use strict';
    var __moduleName = 'test/build_types/main';
    if (!$__0 || !$__0.__esModule)
        $__0 = { 'default': $__0 };
    $__0;
    function getFile(url, cb) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.send(null);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                cb(xhr.responseText);
            }
        };
    }
    getFile(document.getElementsByTagName('link')[0].href, function (content) {
        window.STYLE_CONTENT = content;
    });
    return {};
});
