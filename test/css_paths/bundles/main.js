/*bundlesConfig*/
System.bundles = {"bundles/main":["stealconfig","steal/css","less","steal/less","main"],"bundles/main.css!":["folder/main.less!steal/less","folder/main.css!steal/css","style.css!steal/css"]};
/*stealconfig*/
if(typeof window === "undefined") {
	System.register("less",[], function(){
		var r = require;
		return { __useDefault: true, 'default': r('less') };
	});
} else {
	System.paths.less ="../../bower_components/less/dist/less-1.7.0.js";
}

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
/*less*/
System.set('less', Module({}));
/*steal/less*/
System.set('steal/less', Module({}));
/*main*/
define('main', [
    'folder/main.less!steal/less',
    'folder/main.css!',
    'style.css!'
], function ($__0, $__1, $__2) {
    'use strict';
    var __moduleName = 'test/css_paths/main';
    if (!$__0 || !$__0.__esModule)
        $__0 = { 'default': $__0 };
    if (!$__1 || !$__1.__esModule)
        $__1 = { 'default': $__1 };
    if (!$__2 || !$__2.__esModule)
        $__2 = { 'default': $__2 };
    $__0;
    $__1;
    $__2;
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
    var links = document.getElementsByTagName('link');
    if (links.length) {
        getFile(document.getElementsByTagName('link')[0].href, function (content) {
            window.STYLE_CONTENT = content;
        });
    }
    return {};
});
