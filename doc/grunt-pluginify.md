@function stealTools.grunt.pluginify stealPluginify
@parent steal-tools.grunt 

Write out modules that are optionally transpiled, minified, and bundled.

@body

## Use

`stealPluginify` is a grunt [multi-task](http://gruntjs.com/creating-tasks#multi-tasks). This means that to
build output 

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

## options

## outputs

Outputs is an object names and ouput configuration objects.  Each configuration object contains 

    {
      eachModule: [],
      graphs: [],
      modules: [],
      ignore: [],
      format: [],
      dest: 
    }
