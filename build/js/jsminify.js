var path = require("path");

steal('steal','parse',function(steal, parse){
	/**
	 * @add steal.build.js
	 */
	var js = steal.build.js;
	
	var stealDevTest = /steal\.dev/;
	// removes  dev comments from text
	/**
	 * @function clean
	 * `steal.build.js.clean(text)` removes
	 * `steal.dev.log` and `//!steal-remove-start` / `//!steal-remove-end`
	 * blocks from production code.
	 *     
	 * 
	 * @param {String} text JavaScript source to clean.
	 * @return {String} the source code minus code indended to be removed.
	 */
	js.clean = function( text ) {
		var repRegExp = new RegExp("\/\/!steal-remove-start((?:.|\n)*?)\/\/!steal-remove-end", "g");
		var parsedTxt = text.replace(repRegExp, "");
		
		// the next part is slow, try to skip if possible
		// if theres not a standalone steal.dev, skip

		if(! stealDevTest.test(parsedTxt) ) {
			return parsedTxt;
		}	
		
		var positions = [],
		   	p,
		    tokens, 
			i, 
			position;

		try{
			p = parse(parsedTxt);
		} catch(e){
			print("Parsing problem");
			print(e);
			return parsedTxt;
		}

		while (tokens = p.until(["steal", ".", "dev", ".", "log", "("], ["steal", ".", "dev", ".", "warn", "("])) {
			var end = p.partner("(");
			positions.push({
				start: tokens[0].from,
				end: end.to
			})
		}
		// go through in reverse order
		for (i = positions.length - 1; i >= 0; i--) {
			position = positions[i];
			parsedTxt = parsedTxt.substring(0, position.start) + parsedTxt.substring(position.end)
		}
		return parsedTxt;
	};

	/**
	 * @function minify
	 * 
	 * `steal.build.js.minify(source, options)` minifies the source
	 * of a JavaScript file.  If `source` is not provided,
	 * a minifier function is returned.
	 * 
	 * @param {Source} [source] the JS source code.
	 * 
	 * @param {Object} [options] options to configure the minification:
	 * 
	 *  - compressor "{String}" - which minification engine, defaults to `"localClosure"`.
	 *  - currentLineMap - a map of lines to JS files, used for error reporting when minifying
	 *     several files at once. EX:
	 * 
	 *         {0: "foo.js", 100: "bar.js"}
	 * 
   * @param {Function} [callback] the callback function to be called upon complete.
	 * @return {String|Function} if `source` is provided, the minified
	 * source is returned.  Otherwise a `minifier(source, quiet, currentLineMap)` function is returned
	 * where:
	 * 
	 *   - source - the source code to be minified
	 *   - quiet - if minification should be done without reporting errors
	 *   - currentLineMap - a line map to resolve paths in grouped source 
	 */
	js.minify = function(source, options, callback){
		// return source;
		// get the compressor
		options = options || {};
		var compressor = js.minifiers[options.compressor || "localClosure"]()
		
		if(source){
			// return source+""; //""+compressor( source, true, options.currentLineMap )
			return ""+compressor( source, true, options.currentLineMap, callback )
		} else {
			return  compressor
		}
	}

	//various minifiers
	js.minifiers = {
		// needs shrinksafe.jar at steal/build/javascripts/shrinksafe.jar
		shrinksafe: function() {
			steal.print("steal.compress - Using ShrinkSafe");
			// importPackages/Class doesn't really work
			var URLClassLoader = Packages.java.net.URLClassLoader,
				URL = java.net.URL,
				File = java.io.File,
				ss = new File("steal/build/javascripts/shrinksafe.jar"),
				ssurl = ss.toURL(),
				urls = java.lang.reflect.Array.newInstance(URL, 1);
			urls[0] = new URL(ssurl);

			var clazzLoader = new URLClassLoader(urls),
				mthds = clazzLoader.loadClass("org.dojotoolkit.shrinksafe.Compressor").getDeclaredMethods(),
				rawCompress = null;

			//iterate through methods to find the one we are looking for
			for ( var i = 0; i < mthds.length; i++ ) {
				var meth = mthds[i];
				if ( meth.toString().match(/compressScript\(java.lang.String,int,int,boolean\)/) ) {
					rawCompress = meth;
				}
			}
			return function( src ) {
				var zero = new java.lang.Integer(0),
					one = new java.lang.Integer(1),
					tru = new java.lang.Boolean(false),
					script = new java.lang.String(src);
				return rawCompress.invoke(null, script, zero, one, tru);
			};
		},
		closureService: function() {
			steal.print("steal.compress - Using Google Closure Service");

			return function( src ) {
				var xhr = new XMLHttpRequest();
				xhr.open("POST", "http://closure-compiler.appspot.com/compile", false);
				xhr.setRequestHeader["Content-Type"] = "application/x-www-form-urlencoded";
				var params = "js_code=" + encodeURIComponent(src) + "&compilation_level=WHITESPACE_ONLY" + "&output_format=text&output_info=compiled_code";
				xhr.send(params);
				return "" + xhr.responseText;
			};
		},
		uglify: function() {
			steal.print("steal.compress - Using Uglify");
			return function( src, quiet, nada, callback ) {
				var rnd = Math.floor(Math.random() * 1000000 + 1),
					origFileName = "tmp" + rnd + ".js",
					origFile = new steal.URI(origFileName);

				origFile.save(src);

				var options = {
					err: '',
					output: true
				};
					
				runCommand("node", getCompilerPath("build/js/uglify/bin/uglifyjs"), origFileName,
					options
				);
			
				origFile.remove();

				return options.output;
			};
		},
		localClosure: function() {
			//was unable to use SS import method, so create a temp file
			//steal.print("steal.compress - Using Google Closure app");
			return function( src, quiet, currentLineMap, callback ) {
				var rnd = Math.floor(Math.random() * 1000000 + 1),
					filename = "tmp" + rnd + ".js",
					tmpFile = new steal.URI(filename);

				tmpFile.save(src);

				var options = {
						err: '',
						output: true // This will be a string on the way out.
  				};
				var compilerPath = getCompilerPath("build/js/compiler.jar");
				if ( quiet ) {
					runCommand("java", "-jar", compilerPath, "--compilation_level", "SIMPLE_OPTIMIZATIONS", 
						"--warning_level", "QUIET", "--js", filename, options);
				} else {
					runCommand("java", "-jar", compilerPath, "--compilation_level", "SIMPLE_OPTIMIZATIONS", 
						"--js", filename, options);
				}
				// print(options.err);
				// if there's an error, go through the lines and find the right location
				if( /ERROR/.test(options.err) ){
					if (!currentLineMap) {
						throw options
					}
					else {
						var errMatch;
						while (errMatch = /\:(\d+)\:\s(.*)/g.exec(options.err)) {
							
							var lineNbr = parseInt(errMatch[1], 10), 
								realLine,
								error = errMatch[2];
								
							var lastNum, lastId; 
							print(lineNbr);
							for( var lineNum in currentLineMap ) {
								if( lineNbr < parseInt( lineNum) ){
									break;
								}
								// print("checked "+lineNum+" "+currentLineMap[lineNum])
								lastNum = parseInt(lineNum);
								lastId = currentLineMap[lineNum];
							}
							
							realLine = lineNbr - lastNum;
							
							steal.print('ERROR in ' + lastId + ' at line ' + realLine + ': ' + error + '\n');
							
							
							var text = readFile(lastId), 
								split = text.split(/\n/), 
								start = realLine - 2, 
								end = realLine + 2;
							if (start < 0) 
								start = 0;
							if (end > split.length - 1) 
								end = split.length - 1;
							steal.print(split.slice(start, end).join('\n') + '\n')
						}
					}
				}
				tmpFile.remove();
				return options.output;
			};
		},
		yui: function() {
			// needs yuicompressor.jar at steal/build/js/yuicompressor.jar
			steal.print("steal.compress - Using YUI compressor");

			return function( src ) {
				var rnd = Math.floor(Math.random() * 1000000 + 1),
					filename = "tmp" + rnd + ".js",
					tmpFile = new steal.URI(filename);

				tmpFile.save(src);

				var outBaos = new java.io.ByteArrayOutputStream(),
					output = new java.io.PrintStream(outBaos);
					
				runCommand(
					"java", 
					"-jar", 
					"steal/build/js/yuicompressor.jar", 
					"--charset",
					"utf-8",
					filename, 
					{ output: output }
				);
			
				tmpFile.remove();

				return outBaos.toString();
			};
		}
	};

	function getCompilerPath(p){
		return path.resolve(__dirname, "../..", p);
	}

	return js;
	
});
