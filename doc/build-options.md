@typedef {{}} stealTools.buildOptions buildOptions
@description Options used throughout the build process.

@option {Boolean} [minify=true] Whether the source code is minified prior to writing.

@option {Boolean} [bundleSteal=false] Whether StealJS will be included in the built file. Enabling this option will allow you to limit the initial request to just one script.

@option {Boolean} [removeDevelopmentCode=true] Whether development code (code wrapped with `@steal-remove-{start/stop}`) will be removed.

@option {Array<String>} ignore Specify modules to not include in the final output. For example if you wanted to load jQuery from a cdn you would provide this option:

    {
      ignore: [ "jquery" ]
    }

@option {stealTools.format} format Specifies a format to transpile the dependency graph to. In the multiBuild all code is automatically transpiled to **amd** format. In [stealTools.pluginify] the default is to **global**.
