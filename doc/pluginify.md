@function stealTools.pluginify pluginify
@parent steal-tools.JS 

A function provided by [stealTools.pluginifier] that can build out a specific module.

@signature `pluginify(moduleName, options)`

@param {moduleName} [moduleName=config.main] The module name to build.

@param {{}} [options]

Options that configure how the files are compiled.  These options overwrite the 
`pluginifierOptions` argument passed to [stealTools.pluginifier].

@option {RegExp|Array.<RegExp>} [ignores] A JavaScript RegExp or
an Array of RegExp's that
matches module names that should not be included in the pluginified output.

@option {Boolean} [keepDevTags=false] By default, removes code in between comments like:

    //!steal-remove-start
    REMOVE.THIS;
    //!steal-remove-end

If keepDevTags is true, this code is not removed.

@option {Boolean} [useNormalizedDependencies=true] Use normalized dependency names instead of
relative module names.  For example "foo/bar" will be used instead of "./bar".

@option {function(String, String, String)} [normalize(name, currentModule, address)] An
optional function that will normalize all module names written out. Use this for custom normalization
behavior.


@return {String} The result of `moduleName` being pluginified.
