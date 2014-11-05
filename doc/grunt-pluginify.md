@typedef {{}} stealTools.grunt.pluginify stealPluginify
@parent steal-tools.grunt 

Write out modules that are optionally transpiled, minified, and bundled.

@option {Object<stealTools.grunt.pluginify.task>} tasks Specify pluginify tasks with their own set of `system`, `options`, and [stealTools.grunt.pluginify.output outputs].

@body

## Use

`stealPluginify` is a grunt [multi-task](http://gruntjs.com/creating-tasks#multi-tasks) that is used to build library projects to a variety of formats. This means that to build output 

    grunt.initConfig({
      stealPluginify: {
        main: {
          system: { ... },
          options: { ... },
          outputs: {
            "output 1 name" : { ... }
          }
        }
      }
    });
    
Each `stealPluginify` task is configured by three values:

 - system - describes the [System.config] values used to load modules, this is passed to [stealTools.pluginifier].
 - options - configures special behavior of the loader such as logging.
 - outputs - configures the modules that should be written out, how they 
             should be written out, and where they should be written. 

## system

These are [System.config] values that are used to load modules during the build process. Typically you will want to specify at least the `config` and `main` options like so:

    {
	  config: __dirname + "/config.js",
      main: ["math/add", "math/subtract"]
    }

## options

Options are the [stealTools.buildOptions] used for configuration the behavior of the build, such as whether minification is turned on or not.

## outputs

Outputs is an object names and [stealTools.grunt.pluginify.output output configuration] objects.  Each configuration object contains 

    {
      eachModule: [],
      graphs: [],
      modules: [],
      ignore: [],
      format: [],
      dest: 
    }
