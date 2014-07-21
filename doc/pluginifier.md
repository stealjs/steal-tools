@function stealTools.pluginifier pluginifier
@parent steal-tools.JS 

Build a module and its dependencies to work independently of `steal.js`.

@signature `stealTools.pluginifier(config, pluginifierOptions)`

Loads a module and all of its dependencies and returns a function that
can write out all or parts of the module and its dependency graph
so that they dont depend on `steal.js`.

@param {{}} config

Specifies configuration values to set on 
a [System] loader. The [System.main main] option must be specified. Typically
[System.configPath configPath] is also specified as that is used to set 
[System.baseURL baseURL].  Any System [System.config configuration] can be specified; however,
most other __build__ configuration values are specified in
by [System.buildConfig] in the config file.

@option {String} main The module whos dependencies should be built.
@option {String} [config] The path to a configuration file. This
will also specify `baseURL`.
@option {String} [baseURL] If a configuration file is not used, 
the [System.baseURL baseURL] value must be set.

@param {{}} pluginifierOptions

Configures the behavior of loading the modules and acts as default values
for the resulting [stealTools.pluginify pluginify function's] options argument.

@option {Boolean} [verbose=false] Set to true to get a lot of warning messages.
@option {Boolean} [quiet=false] Set to true to log nothing.

@return {Promise.<stealTools.pluginify>} A deferred that resolves to a function
that can write out all or part of the loaded dependency tree. 



@body

## Use

`stealTools.pluginifier` is a way to build projects without needing to include steal.js in production at 
all. Some of Steal's advanced features such as [bundles](#bundles) need steal.js to work, but for 
more simple projects pluginifier is a good option. Plugnifier is also used when building open source projects 
where you want to split your modules into individual module file (hence *plugins*) and 
distribute them that way.

Like [stealTools.build], pluginifier can be used from the command-line, from Grunt, or 
programmatically in Node.js. For this example we're going to use 
pluginifier programmatically in order to showcase 
it's more advanced functionality:

    var pluginifier = require("steal-tools").pluginifier;
    var fs = require("fs");

    pluginifier({
      config: __dirname + "/config.js",
      main: "main"
    }).then(function(pluginify){
      // Get the main module and it's dependencies as a string
      var main = pluginify();

      // Get just a dependency and it's own dependencies as a string
      var myModule = pluginify("my_module");

      // Get the main module, ignoring a dependency we don't want.
      var mainAlone = pluginify("main", {
        ignore: ["my_module"]
      });

      // Now you can do whatever you want with the module.
      fs.writeFileSync("out_main.js", mainAlone, "utf8");
    });

As you can see, pluginifier takes an object containing the 
System configuration and returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise). 
The promise will return another function (named pluginify in this example) that can be used to generate 
a string containing a module and it's dependencies. By default the pluginify 
function will return the main module, but can be used to generate any dependency in the graph.
