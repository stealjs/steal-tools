@typedef {{}} steal-tools.BuildOptions BuildOptions
@parent steal-tools.types

Options used to configure the build process.

@option {Boolean|Function} [minify=true] 

**Boolean**

Sets whether the source code is minified prior to writing.

Minification is optional but on by default, you can turn it off by doing:

```javascript
stealtools.build(config, {
	minify: false
});
```
---
**Function**

A function can be provided to handle minification of each file in a bundle, e.g:

```javascript
stealTools.build(config, {
	minify: function(source, options) {
		// use your own library to minify source.code 
		source.code = doCustomMinification(source.code);

		// return the source object when minification is complete
		return source;
	}
});
```

The function takes a `source` object as the first parameter, this object contains the `code` and its AST version after the transpilation
process; the second parameter, `options`, is the [steal-tools.BuildOptions] object passed to configure the build process.

@option {Boolean} [bundleSteal=false] Sets whether StealJS will be included in the built file. Enabling this option will allow you to limit the initial request to just one script.

@option {Boolean} [verbose=false] `true` turns on verbose output. Defaults to `false`.

@option {Boolean} [quiet=false] No logging.  Defaults to `false`.

@option {String} [dest="dist"] Specifies the destination folder for the build. By default steal-tools will write to the `BASEURL + '/dist'` folder where BASEURL is the local Steal [config.baseURL baseURL], usually the same folder that your package.json is located.

  The path can be specified in three ways:

 - Absolute path - dest starts with `/`, or matches _/^\w+:[\/\\]/_, like:  `__dirname+"/place"`, or `"c:\my\bundles"`.
 - Relative to `process.cwd()` - dest starts with `./`, like `"./place"`.
 - Relative to [config.baseURL baseURL] - dest looks like: "packages", "foo/bar".

@option {steal-tools.BundleAssetsOptions|Boolean} [bundleAssets=false] Set to true to have assets from your project bundled into your dest folder.

@option {Array.<moduleName>} ignore An array of module names that should be ignored and not included in the bundled file. 
For more information take a look at the `ignore` usage http://stealjs.com/docs/steal-tools.build.html#ignore


@option {Number} [maxBundleRequests=3] The maximum number of bundles that need to be loaded
for any `bundle` module. Defaults to `3`.

@option {Number} [maxMainRequests=3] The maximum number of bundles that will be loaded for any `main`
module. Defaults to `3`.

@option {Boolean} [removeDevelopmentCode=true] Remove any development code from the bundle specified 
using `//!steal-remove-start`, and `//!steal-remove-end` comments.

@option {Object} [cleanCSSOptions] A hash of options to customize the minification of css files. 
All available options are listed in the [clean-css documentation](https://github.com/jakubpawlowicz/clean-css#how-to-use-clean-css-programmatically).

@option {Object} [uglifyOptions] A hash of options to customize the minification of JavaScript files. StealTools uses the 
top-level `minify` function of uglify-js, and the available options are listed [here](https://github.com/mishoo/UglifyJS2#the-simple-way).
The option `fromString` is used internally and will always be `true`; any other value will be ignored.

@option {Boolean} [sourceMaps=false] Generate source maps alongside your bundles.

@option {Boolean} [sourceMapsContent=false] Include the original source contents in the generated source maps. Use this option if your production environment doesn't have access to the source files. Will result in a larger source maps size but will cause fewer requests.

@option {steal-tools.BuildOptions.transpile} [transpile] A function that handles the transpiling of ES6 source to a format for production.

@option {Boolean} [watch=false] Actives watch mode which will continuously build as you develop your application.

@option {Boolean|String} [bundleManifest=false] Generates an HTTP2-push like manifest of the application bundles for server-side preload.

When set to `true` a `bundles.json` file will be written at the top level of the folder where the built assets are located (see the property`dest` above). 

A full path to the desired JSON filename can be provided, too. e.g:

```js
stealTools.build(config, { 
  bundleManifest: path.join(__dirname, "dist", "my-manifest.json")
});
```

The manifest has the following shape:

```json
{
  "[ENTRY-POINT-BUNDLE-NAME]": {
    "[SHARED-BUNDLE-NAME]": {
      "type": "style",
      "weight": 1
    },
    "[SHARED-BUNDLE-NAME]": {
      "type": "script",
      "weight": 2
    }
  }
}
```

The top-level objects correspond to _entry level bundles_; these are the bundles needed to start up individual "pages" of the application and  progressively loaded bundles.

The nested objects are _shared bundles_, these are created by `steal-tools` to minimize the number of HTTP requests needed to load the application code. 

Each _shared bundle_ has two properties, `type`, an string that indicates whether the bundle contains script code or styles and `weight`, a number indicating loading priority; a bundle with lower weight should be loaded before other bundles, e.g: style bundles have `weight` of `1` and should be loaded before script bundles.
