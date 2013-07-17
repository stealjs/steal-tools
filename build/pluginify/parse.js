
steal("esprima", function(esprima){

	// Extracts the steal callback function
	return function (text) {
		var parsed = esprima.parse(text, {
			loc: true
		});
		var lines = text.split('\n');
		var fn = [];
		var processSteal = function (arg) {
			if (arg.type === 'FunctionExpression') {
				var startLine = arg.loc.start.line - 1,
					endLine = arg.loc.end.line - 1;

				fn = [];

				if (startLine === endLine) {
					// If our function begins and ends in the same line just substring it out
					fn.push(lines[startLine].substring(arg.loc.start.column, arg.loc.end.column))
				} else {
					// If we have more than one line get the start of the function
					fn.push(lines[startLine].substring(arg.loc.start.column));
					// Everything in between
					fn.push.apply(fn, lines.slice(startLine + 1, endLine));
					// End of the function
					fn.push(lines[endLine].substring(0, arg.loc.end.column));
				}

			}
		};

		parsed.body.forEach(function (statement) {
			var expr = statement.expression;
			// Looks for the first steal(..., function() {})
			if (statement.type === 'ExpressionStatement' && expr.callee && expr.callee.name === 'steal') {
				expr.arguments.forEach(processSteal);
			}
		});

		return fn.join('\n');
	};

});
