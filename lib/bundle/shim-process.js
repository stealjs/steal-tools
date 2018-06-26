function(global, env){ // jshint ignore:line
    if(typeof process === "undefined") {
        global.process = {
    		argv: [],
    		cwd: function(){
    			return "";
    		},
    		browser: true,
    		env: {
    			NODE_ENV: env || "development"
    		},
    		version: '',
    		platform: (typeof navigator !== "undefined" && navigator.userAgent && /Windows/.test(navigator.userAgent)) ? "win" : ""
    	};
    }
}
