@typedef {{}} stealTools.grunt.build stealBuild
@parent steal-tools.grunt 

The `stealBuild` options object values.

@option {Object} system Specifies the `config` argument in
[stealTools.build]. The [System.main main] option must be specified. Typically
[System.configPath configPath] is also specified as that is used to set 
[System.baseURL baseURL].  Any System [System.config configuration] can be specified; however,
most other __build__ configuration values are specified in
by [System.buildConfig] in the config file.

@option {Object} buildOptions Specifies the `options` argument in [stealTools.build].


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

As you can see, the grunt task takes 2 object as its options, `system` and `buildOptions`.
