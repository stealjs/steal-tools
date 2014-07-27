@function stealTools.cmd.build stealTools build
@parent steal-tools.cmd 

Builds stealTools from the command line.

@signature `stealTools build [--OPTION_NAME OPTION_VALUE]...`

@param {String} OPTION_NAME Any `config` or `options` name in [stealTools.build].

@param {String} OPTION_VALUE The value of `OPTION_NAME`.

@body

## Use

steal-tools must have been installed into the commandLine like:

    npm install steal-tools -g
    
Then you can run `stealTools` like:

    steal build --config app/config.js --main app/app
