@function stealTools.build build
@parent steal-tools.JS 

Build a module and all of its dependencies and optionally other bundles to progressively load.

@signature `stealTools.build(config, options)`

@param {{}} config

Specifies configuration values to set on 
a [System] loader. The [System.main main] option must be specified. Typically
[System.configPath configPath] is also specified as that is used to set 
[System.baseURL baseURL].  Any System [System.config configuration] can be specified; however,
most other __build__ configuration values are specified in
by [System.buildConfig] in the config file.

@option {String|Array<moduleName>} main The module or modules whos dependencies 
should be built.  If main is specified as an Array, 

@option {String} [config] The path to a configuration file. This
will also specify `baseURL`.
@option {String} [baseURL] If a configuration file is not used, 
the [System.baseURL baseURL] value must be set.

@option {String} [bundlesPath='dist/bundle']  Specifies the path where the production bundles should be 
placed. Often, this is the same value as [System.bundlesPath]. By default, the location is `"dist/bundles"`.

The path can be specified in three ways:


 - Absolute path - bundlesPath starts with `/` or matches _/^\w+:[\/\\]/_ like:  `__dirname+"/place"` or `"c:\my\bundles"`.
 - Relative to `process.cwd()` - bundlesPath starts with `./` like `"./place"`.
 - Relative to [System.baseURL baseURL] - bundlesPath looks like: "packages", "foo/bar".
  
@param {{}} [options]

Specifies the behavior of the build.



@option {Boolean} [minify=true] Prevents minification.
@option {Boolean} [debug=false] `true` turns on debug messages.
@option {Boolean} [quiet=false] No logging.
@option {Boolean} [bundleSteal=false] Set to true to include steal in the main bundle.
@option {Array.<moduleName>} bundle An array of module names that should be
progressively loaded.
@option {Number} [bundleDepth=3] The maximum number of bundles that need to be loaded
for any `bundle` module.
@option {Number} [mainDepth=3] The maximum number of bundles that will be loaded for any `main`
module.
@option {Boolean} [removeDevelopmentCode=true] Remove any development code from the bundle specified using `//!steal-remove-start` and `//!steal-remove-end` comments.


@return {{}}

@option {buildGraph} graph A map of moduleNames to node.
@option {steal} steal The steal function used to load the main module.
@option {Loader} loader The loader used to load the main module.
@option {Array} bundles The builds written out.

@body

## Use

    var stealTools = require("steal-tools");
    
    stealTools.build({
      main: ["login","homepage"],
      config: __dirname+"/config.js"
    },{
      bundleSteal: true,
      // the following are the default values, so you don't need
      // to write them.
      minify: true,
      debug: false,
      quiet: false,
      bundleDepth: 3,
      mainDepth: 3
    })


## Implementation

Implemented in [steal-tools](https://github.com/bitovi/steal-tools).
