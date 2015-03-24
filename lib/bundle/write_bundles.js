// # lib/bundle/write_bundles.js
// Given an array of bundles and the baseURL
// Writes them out to the file system.

var winston = require('winston');
var bundleFilename = require("./filename"),
  concatSource = require("../bundle/concat_source"),
  normalizeSource = require('./normalize_source'),
  fs = require("fs"),
  mkdirp = require("fs-extra").mkdirp,
  dirname = require("path").dirname,
  addSourceMapUrl = require("../bundle/add_source_map_url");

module.exports = function(bundles, configuration) {
  var bundlesDir = configuration.bundlesPath + "/";
  // Create the bundle directory
  var bundleDirDef = configuration.mkBundlesPathDir();

  // A deferred containing a deferred that resolves when all
  // deferreds have been built.
  var builtBundleDeferreds = [];

  bundles.forEach(function(bundle) {
    builtBundleDeferreds.push(new Promise(function(resolve, reject) {
      var bundlePath = bundlesDir + "" + bundleFilename(bundle);

      // Adjusts URLs
      normalizeSource(bundle, bundlePath);

      // Combines the source
      concatSource(bundle);

	  addSourceMapUrl(bundle);
	  var code = bundle.source.code;
	  var map = bundle.source.map;
	  
      // Log the bundles
      winston.info("BUNDLE: %s", bundleFilename(bundle));
      winston.debug(Buffer.byteLength(code, "utf8") + " bytes");

      bundle.nodes.forEach(function(node) {
        winston.info("+ %s", node.load.name);
      });

      // Once a folder has been created, write out the bundle source
      bundleDirDef.then(function() {
        mkdirp(dirname(bundlePath), function(err) {
          if (err) {
            reject(err);
          }
          else {
            fs.writeFile(bundlePath, code, function(err) {
              if(err) {
                reject(err);
              } else {
                if(!map) {
                  resolve(bundle);
                }
                // Write out the source map
                fs.writeFile(bundlePath+".map", map, function(err) {
                  if(err) return reject(err);
                  resolve(bundle);
                });
              }
            });
          }
        });

      }).catch(function(err) {
        reject(err);
      });
    }));

  });

  return Promise.all(builtBundleDeferreds);

};

		
