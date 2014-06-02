// # lib/bundle/write_bundles.js
// Given an array of bundles and the baseURL
// Writes them out to the file system.

var winston = require('winston');
var makeBundleDir = require("./mkdir"),
	bundleFilename = require("./filename"),
	concatSource = require("../bundle/concat_source"),
	normalizeSource = require('./normalize_source'),
	directory = require("./dist_dir");
	fs = require('fs');
	
module.exports = function(bundles, baseURL, distDir){
	
	// Create the bundle directory
	var bundleDirDef = makeBundleDir(baseURL, distDir),
		bundleNames = {},
		distDir = directory.dist(baseURL, distDir) + "/";
	
	// A deferred containing a deferred that resolves when all
	// deferreds have been built.
	var builtBundleDeferreds = [];
	
	bundles.forEach(function(bundle){
		builtBundleDeferreds.push(new Promise(function(resolve, reject){
			winston.info("BUNDLE: %s", bundleFilename(bundle));
			
			bundle.nodes.forEach(function(node){
				winston.info("+ %s", node.load.name);
			});

			var bundlePath = distDir+""+bundleFilename(bundle);
			
			// Adjusts URLs
			normalizeSource(bundle, bundlePath);
			
			// Combines the source
			concatSource(bundle);
			
			// Once a folder has been created, write out the bundle source
			bundleDirDef.then(function(bundleDir){
				
				fs.writeFile(bundlePath, bundle.source, function(err) {
				    if(err) {
				        reject(err);
				    } else {
				        resolve(bundle);
				    }
				}); 
				
			}).catch(function(err){
				reject(err);
			});
		}));

	});
	
	return Promise.all(builtBundleDeferreds);
	
};

		
