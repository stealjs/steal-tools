

var path = require('path'),
	source = require('../node/source'),
	url = require('url');

var isAbsoluteOrData = function( part ) {
	return /^(data:|http:\/\/|https:\/\/|\/)/.test(part)
};

module.exports = function(bundle, outPath){
	var outDirname = path.dirname(outPath);
	
	if(bundle.buildType === 'css') {
		
		bundle.nodes.forEach(function(node){

			// path from out to the css file
			var pathToCss = path.relative(outDirname, path.dirname(node.load.address) )+"/";
			node.normalizedSource = source(node).replace(/url\(['"]?([^'"\)]*)['"]?\)/g, function( whole, part ) {
				if(isAbsoluteOrData(part)) {
					return whole;
				} else {
					return "url(" +url.resolve( pathToCss, part) + ")";
				}
			});
	
			
		});
	}
	
};
