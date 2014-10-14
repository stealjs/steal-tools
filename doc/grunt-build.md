@typedef {{}} stealTools.grunt.build stealBuild
@parent steal-tools.grunt 

The `stealBuild` options object values.

@option {Object} system Specifies the `config` argument in
[stealTools.build]. The [System.main main] option must be specified. Typically
[System.configPath configPath] is also specified as that is used to set 
[System.baseURL baseURL].  Any System [System.config configuration] can be specified; however,
most other __build__ configuration values are specified in
by [System.buildConfig] in the config file.

@option {Object} buildOptions Specifies the `options` argument in [stealTool.build].

@option {Function} after Specifies the function that will be executed after build,
"bundles" result will be passed there. Function maybe synchronous (when returns undefined)
or asynchronous (when returns instance of Promise).


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
            },
            after(bundles){
            	new Promise(function(resolve){

            		// do something with bundle
            		console.log('Name of main bundle module', bundle[0].name)
            		console.log('Source code of main bundle module', bundle[0].source)
            		...
            		// finish custom action asynchronously
            		resolve()
            	})
            }
          }
        }
      }
    });

As you can see, the grunt task takes 2 object as its options, `system` and `buildOptions`.
