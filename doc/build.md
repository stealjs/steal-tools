@function steal-tools.build build
@parent steal-tools.JS 

Build a module and all of its dependencies and, optionally, other bundles to progressively load.

@signature `stealTools.build(config, options)`

@param {steal-tools.SystemConfig} config

Specifies configuration values to set on the System loader.  In addition to the `main`, `config`, and `baseUrl` values 
specified in [steal-tools.SystemConfig], an additional `bundlesPath` is sometimes provided.


  @option {String} [bundlesPath='dist/bundle']  Specifies the path where the production bundles should be 
  placed. Often, this is the same value as [System.bundlesPath]. By default, the location is `"dist/bundles"`.

  The path can be specified in three ways:

 - Absolute path - bundlesPath starts with `/`, or matches _/^\w+:[\/\\]/_, like:  `__dirname+"/place"`, or `"c:\my\bundles"`.
 - Relative to `process.cwd()` - bundlesPath starts with `./`, like `"./place"`.
 - Relative to [System.baseURL baseURL] - bundlesPath looks like: "packages", "foo/bar".
 
  
@param {{}} [options]

Specifies the behavior of the build.

  @option {Boolean} [minify=true] Minifies the built packages.  Defaults to `true`.
  
  @option {Boolean} [debug=false] `true` turns on debug messages. Defaults to `false`.
  
  @option {Boolean} [quiet=false] No logging.  Defaults to `false`.
  
  @option {Boolean} [bundleSteal=false] Set to true to include steal in the main bundle.
  
  @option {Array.<moduleName>} bundle An array of module names that should be
  progressively loaded.
  
  @option {Number} [bundleDepth=3] The maximum number of bundles that need to be loaded
  for any `bundle` module. Defaults to `3`.
  
  @option {Number} [mainDepth=3] The maximum number of bundles that will be loaded for any `main`
  module. Defaults to `3`.
  
  @option {Boolean} [removeDevelopmentCode=true] Remove any development code from the bundle specified 
  using `//!steal-remove-start`, and `//!steal-remove-end` comments.
  
  @option {Object} [cleanCSSOptions] A hash of options to customize the minification of css files. 
  All available options are listed in the [clean-css documentation](https://github.com/jakubpawlowicz/clean-css#how-to-use-clean-css-programmatically).
  
  @option {Object} [uglifyOptions] A hash of options to customize the minification of JavaScript files. StealTools uses the 
  top-level `minify` function of uglify-js, and the available options are listed [here](https://github.com/mishoo/UglifyJS2#the-simple-way).
  The option `fromString` is used internally and will always be `true`; any other value will be ignored.

@return {Promise<{}>} A promise that resolves, if successful to an object with the following data:

  @option {buildGraph} graph A map of moduleNames to node.
  @option {steal} steal The steal function used to load the main module.
  @option {Loader} loader The loader used to load the main module.
  @option {Array} bundles The builds written out.

@body

## Use

The following uses steal-tool's `build` method to programatically build out the "my-app"
module as bundles.    

    var stealTools = require("steal-tools");
    
    var promise = stealTools.build({
      main: "my-app",
      config: __dirname+"/package.json!npm"
    },{
      // the following are the default values, so you don't need
      // to write them.
      minify: true,
      debug: true
    });

This will build bundles like:

    /dist/bundles/
      my-app.js
      my-app.css

To load the bundles, a html page should have a script tag like:

```
<script src='./node_modules/steal/steal.production.js' 
        main='my-app'
        env='production'></script>
```

## bundleSteal

Setting the `bundleSteal` option to `true` includes _steal.js_ and the [System.configMain] in each
main bundle.  This means one fewer http request.  

    var promise = stealTools.build({
      main: "my-app",
      config: __dirname+"/package.json!npm"
    },{
      bundleSteal: true
    });

This will build bundles like:

    /dist/bundles/
      my-app.js
      my-app.css

To load the bundles, a html page should have a script tag like:

```
<script src='./dist/bundles/my-app.js' 
        config='../../package.json!npm'></script>
```

The [System.configPath] must be given if a [System.configMain config file] is in the bundle;
otherwise, [System.baseURL] should be set like:

```
<script src='./dist/bundles/my-app.js' 
        base-url='../../'></script>
```


## bundlesPath

The `bundlesPath` option specifies where the bundles should be looked for
relative to [System.baseURL].  It will also change where the bundles are written out.

    var promise = stealTools.build({
      main: "my-app",
      config: __dirname+"/package.json!npm",
      bundlesPath: "mobile/assets"
    },{
      bundleSteal: true
    });

This will build bundles like:

    /mobile/assets/
      my-app.js
      my-app.css

To load the bundles, a html page should have a script tag like:

```
<script src='../mobile/assets/my-app.js' 
        config='../package.json!npm'
        bundles-path='mobile/assets'
        ></script>
```

> Notice: bundlesPath should typically not be set in your
config file. Instead, it should be set when `.build` is called
and as an attribute in the script that loads _steal.js_.

## Multi-page use

The following uses steal-tool's `build` method to programatically build out the "login" and "homepage"
modules as bundles.    

    var stealTools = require("steal-tools");
    
    var promise = stealTools.build({
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
    });

Assuming that "login" and "homepage" need the same modules, the following bundles will be created:

    /dist/bundles/
      homepage.js
      homepage.css
      login.js
      login.css
      login_homepage.css
      login_homepage.js
      
To load the homepage JS, CSS and the shared JS and CSS, an html page should have a script tag like:

```
<script src='./node_modules/steal/steal.js' 
        main='homepage'
        env='production'>
```

