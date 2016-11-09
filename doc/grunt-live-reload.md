@typedef {{}} steal-tools.grunt.live-reload steal-live-reload
@parent steal-tools.grunt

The `steal-live-reload` options object's values.

@option {Object} steal Specifies the `config` argument in
[steal-tools.build]. The [config.main main] option must be specified. Typically,
[config.configPath configPath] is also specified, as that is used to set
[config.baseURL baseURL].  Any Steal [config.config configuration] can be specified; however,
most other __build__ configuration values are specified
by [config.buildConfig], in the config file.

@option {Object} liveReloadOptions Specifies the `options` argument
to [steal-tools.cmd.live-reload steal-tools live-reload].

@body

## Use

`"steal-live-reload"` is registered as a Grunt multi-build task. Specify the
default "steal-live-reload" task options, as follows:

    grunt.initConfig({
      "steal-live-reload": {
        default: {
          options: {
            steal: {
              config: __dirname + "/app/config.js",
              main: "app/app"
            },
            liveReloadOptions: {
              liveReloadPort: 8013
            }
          }
        }
      }
    });

The Grunt task takes 2 objects as its
options: `steal`, and `liveReloadOptions`.

## steal

These are [config.config] values that are used to
load modules during the build process. Typically, you will want
to specify at least the `config` and `main` options, like so:

    {
	  config: __dirname + "/config.js",
      main: ["math/add", "math/subtract"]
    }

## liveReloadOptions

The `liveReloadOptions` property specifies the properties on the `options`
argument to [steal-tools.cmd.live-reload steal-tools live-reload].

The following options are available:

 - liveReloadPort <i>{Number}</i>


Read more about them on [steal-tools.cmd.live-reload steal-tools live-reload].

