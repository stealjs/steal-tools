var events = require('events'),
  util = require('util'),
	winston = require('winston'),
  colors = require('colors'),
  Transport = winston.Transport;

var StealTransport = exports.StealTransport = function (options) {
  Transport.call(this, options);
};

util.inherits(StealTransport, Transport);

StealTransport.prototype.name = 'steal';

StealTransport.prototype.log = function (level, msg, meta, callback) {
  if (this.silent) {
    return callback(null, true);
  }

  var output = '';

  if(level === 'debug') {
    output += msg.grey;
  } else if(level === 'warn') {
   output += ('WARNING: ' + msg).yellow;
  } else if(level === 'error') {
    output += ('ERROR: ' + msg).red;
  } else {
    output += msg;
  }

  if (meta !== null && meta !== undefined) {
    if (meta && meta instanceof Error && meta.stack) {
      meta = meta.stack;
    }

    if (typeof meta !== 'object') {
      output += ' ' + meta;
    }
    else if (Object.keys(meta).length > 0) {
      output += ' ' + (
        options.prettyPrint
          ? ('\n' + util.inspect(meta, false, null, options.colorize))
          : exports.serialize(meta)
        );
    }
  }

  if (level === 'error' || level === 'debug') {
    process.stderr.write(output + '\n');
  } else {
    process.stdout.write(output + '\n');
  }

  this.emit('logged');
  callback(null, true);
};

exports.setup = function(config) {
	winston.remove(winston.transports.Console);
	winston.add(StealTransport, {
		level: config.verbose ? 'debug' : 'info',
		colorize: true,
		silent: config.quiet && !config.verbose
	});
};
