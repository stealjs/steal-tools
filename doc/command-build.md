@function steal-tools.cmd.build steal-tools build
@parent steal-tools.cmd 

Builds steal-tools from the command line.

@signature `steal-tools build [--OPTION_NAME OPTION_VALUE]...`

@param {String} OPTION_NAME Any `config` or `options` name in [steal-tools.build].

@param {String} OPTION_VALUE The value of `OPTION_NAME`.

@body

## Use

steal-tools must have been installed into the command line, like:

    npm install steal-tools -g
    
Then you can run `steal-tools`, like:

    steal-tools build --config app/config.js --main app/app
