@typedef {{}} steal-tools.grunt.builder stealBuilder
@parent steal-tools.grunt 

The `stealBuild` options object values.

@option {Object} system Specifies the `config` argument in
[steal-tools.build]. The [System.main main] option must be specified. Typically
[System.configPath configPath] is also specified as that is used to set 
[System.baseURL baseURL].  Any System [System.config configuration] can be specified; however,
most other __build__ configuration values are specified in
by [System.buildConfig] in the config file.

@option {Object} buildOptions Specifies the `options` argument 
to [steal-tools.build stealTools.build].


@body

## Use

`"stealBuild"` is registered as a grunt multi-build task. Specify the
default "stealBuild" task options as follows:

    grunt.initConfig({
      stealBuild: {
        default: {
          options: {
            system: {
              config: __dirname + "/app/config.js",
              main: "app/app"
            },
            buildOptions: {
              minify: false
            }
          }
        }
      }
    });

The grunt task takes 2 object as its 
options, `system` and `buildOptions`.

## system

These are [System.config] values that are used to 
load modules during the build process. Typically you will want 
to specify at least the `config` and `main` options like so:

    {
	  config: __dirname + "/config.js",
      main: ["math/add", "math/subtract"]
    }

## buildOptions

The `buildOptions` property specifies the properties on the `options`
argument to [steal-tools.build stealTools.build]. The following options are available:

{{#each [steal-tools.build].signatures.0.params.1.types.0.options}}
 - {{name}} <i>{{{makeTypesString types}}}</i>{{/each}}
 
Read more about them on [steal-tools.build stealTools.build].

