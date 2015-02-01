@function steal-tools.cmd.transform steal-tools transform
@parent steal-tools.cmd 

Transform a module from the command line.

@signature `steal-tools transform [--OPTION_NAME OPTION_VALUE]...`

@param {String} OPTION_NAME Any `config`, `pluginifierOptions` or `options` name in 
[steal-tools.transformImport] or [steal-tools.transform transform].

@param {String} OPTION_VALUE The value of `OPTION_NAME`.  The `ignores` option
will be converted to a regular expression.

@return {String} Writes the output to the console.

@body

## Use

steal-tools must have been installed into the commandLine like:

    npm install steal-tools -g
    
Then you can run `steal-tools` like:

    steal-tools transform \
               --config app/config.js \
               --main app \
               --ignores foo/.+
               > app.js
               
