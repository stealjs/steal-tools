@typedef {{}} steal-tools.BuildOptions BuildOptions
@parent steal-tools.types

Options used to configure the build process.

@option {Boolean} [minify=true] Sets whether the source code is minified prior to writing.

@option {Boolean} [bundleSteal=false] Sets whether StealJS will be included in the built file. Enabling this option will allow you to limit the initial request to just one script.

@option {Boolean} [removeDevelopmentCode=true] Sets whether development code (code wrapped with `@steal-remove-{start/stop}`) will be removed.

@option {Array<String>} ignore Specify modules to exclude in the final output. For example, if you wanted to load jQuery from a cdn, you would provide this option:

    {
      ignore: [ "jquery" ]
    }

@option {steal-tools.format} format Specifies a format for transpiling the dependency graph. In the multiBuild, all code is automatically transpiled to **amd** format. In [steal-tools.transform], the default is to **global**.
