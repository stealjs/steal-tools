@function stealTools.cmd.pluginify stealTools pluginify
@parent StealTools.cmd 

Pluginifies a module from the command line.

@signature `stealTools pluginify [--OPTION_NAME OPTION_VALUE]...`

@param {String} OPTION_NAME Any `config`, `pluginifierOptions` or `options` name in 
[stealTools.pluginifier] or [stealTools.pluginify pluginify].

@param {String} OPTION_VALUE The value of `OPTION_NAME`.  The `ignores` option
will be converted to a regular expression.

@return {String} Writes the output to the console.

@body

## Use

StealTools must have been installed into the commandLine like:

    npm install steal-tools -g
    
Then you can run `stealTools` like:

    stealTools pluginify \
               --config app/config.js \
               --main app \
               --ignores foo/.+
               > app.js
               
