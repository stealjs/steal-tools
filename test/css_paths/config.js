if(typeof window === "undefined") {
	System.register("less",[], function(){
		var r = require;
		return { __useDefault: true, 'default': r('less') };
	});
} else {
	System.paths.less ="../../bower_components/less/dist/less-1.7.0.js";
}
