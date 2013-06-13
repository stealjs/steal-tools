var fs = require('fs'),
	jsdom = require('jsdom').jsdom,
	path = require('path'),
	XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

/*
 * We have to shim XHR in order to make sure we
 * use the file:// protocol.
 */
var ShimXHR = function(){
	XMLHttpRequest.apply(this, arguments);

	var oldOpen = this.open;
	this.open = function(method, url){
		url = "file://" + process.cwd() + "/" + url;
		arguments[1] = url;
		return oldOpen.apply(this, arguments);
	};
};


steal('steal',function(s){
	// Methods for walking through steal and its dependencies
	
	// which steals have been touched in this cycle
	var touched = {},
		
		//recursively goes through dependencies
		// stl - a steal
		// CB - a callback for each steal
		// depth - true if it should be depth first search, defaults to breadth
		// includeFns - true if it should include functions in the iterator
		iterate = function(stl, CB, depth, includeFns){
			// load each dependency until
			var i =0,
				depends = stl.dependencies.slice(0); 

			// this goes through the scripts until it finds one that waits for 
			// everything before it to complete
			//console.log('OPEN', stl.options.id, "depends on", depends.map(function(stl){
			//	return stl.options.id+":"+stl.options.type
			//}).join(","))
			
			// if(includeFns){
				// if(!depends.length){
					// touch([stl], CB)
				// }
			// }
			while(i < depends.length){
				if(depends[i] === null || depends[i].waits){
					// once we found something like this ...
					// if(includeFns){
						// var steals = depends.splice(0,i+1),
							// curStl = steals[steals.length-1];
					// } else {
						// removes all steals before the wait
						var steals = depends.splice(0,i),
							// cur steal is the waiting dependency
							curStl = depends.shift();
					// }
					
					// load all these steals, and their dependencies
					loadset(steals, CB, depth, includeFns);

					if(curStl) { // curStl can be null
						if(depth){
							// load any dependencies
							loadset(curStl.dependencies, CB, depth, includeFns);
							// probably needs to change if depth
							touch([curStl], CB)
						} else {
							touch([curStl], CB);
							loadset(curStl.dependencies, CB, depth, includeFns);
						}
					}
					i=0;
				}else{
					i++;
				}
			}
			
			// if there's a remainder, load them
			if(depends.length){
				loadset(depends, CB, depth, includeFns);
			}
		  
		},
		// loads each steal 'in parallel', then 
		// loads their dependencies one after another
		loadset = function(steals, CB, depth, includeFns){
			// doing depth first
			if(depth){
				// do dependencies first
				eachSteal(steals, CB, depth, includeFns)
				
				// then mark
				touch(steals, CB);
			} else {
				touch(steals, CB);
				eachSteal(steals, CB, depth, includeFns)
			}
		},
		touch = function(steals, CB){
			for(var i =0; i < steals.length; i++){
				if(steals[i]){
					var uniqueId = steals[i].options.id;
					//print("  Touching "+uniqueId )
					if(!touched[uniqueId]){
						CB( steals[i] );
						touched[uniqueId] = true;
					}
				}
				
				
			}
		},
		eachSteal = function(steals, CB, depth, includeFns){
			for(var i =0; i < steals.length; i++){
				//print("  eachsteal ",name(steals[i]))
				iterate(steals[i], CB, depth, includeFns)
			}
		},
		name = function(s){
			return s.options.id;
		},
	/**
	 * @typedef {{}} steal.build.openOptions OpenerObject
	 * 
	 * @option {function():boolean,Boolean,function():undefined} each(filter,depth,callback)
	 *
	 * - each(filter, depth, callback(options, stel)) - goes through steals loaded by this
	 *   application.  You can provide it a:
	 * 
	 * - filter - a function to filter out some types of steal methods, 
	 *   it supports js and css.
	 * - depth - if true, goes through with breadth first search, false is 
	 *   breadth. Defaults to breadth (how steal loads scripts)
	 * - callback - a method that is called with each steal option
	 * 
	 *   opener.each(function(option){
	 *     console.log(option.text)
	 *   })
	 *
	 * @option {steal} steal the steal loaded by the app
	 * @option {String} url the html page opened
	 * @option {steal} rootSteal the 'root' steal instance
	 * @option {steal} rootSteal the first steal file
	 *  
	 *
	 */
		window = (function() {
			return this;
		}).call(null, 0);
	/**
	 * @function steal.build.open
	 * @parent steal.build
	 *
	 * @signature `steal.build.open(url, [stealData, cb])`
	 *
	 * @param {String} url The html page to open.
	 * @param {{}} [stealData] Data to [steal.config configure steal] with.
	 * @param {function(steal.build.openOptions):undefined} cb(openerObject) An object with properties that makes extracting 
	 * the content for a certain tag slightly easier.
	 *
	 * @param {Boolean} [includeFns=true]  indicates that iteration should
	 * happen
	 * @return {{}} an object with properties that makes extracting 
	 * the content for a certain tag slightly easier.
	 *
	 * @body
	 * 
	 * `steal.build.open(url, [stealData], cb(opener) )`  
	 * opens a page that typically uses steal.js. Once all
	 * scripts have been loaded, `cb` is called back with `opener`.
	 * `opener` is an object that helps walk through the modules 
	 * loaded by steal.
	 * 
	 *     steal.build.open(
	 *       "page.html",
	 *       {
	 * 	       startId: "myapp"
	 *       }, 
	 *       function(opener){})
	 * 
	 * `open` opens a page by:
	 * 
	 *   - temporarily deleting the rhino steal
	 *   - opening the page with jsdom
	 *   - setting back rhino steal, saving envjs's steal as steal._steal;
	 * 
	 */
	//
	s.build.open = function( url, stealData, cb, includeFns ) {
		// save and remove the old steal
		var oldSteal = s,
			// new steal is the steal opened
			newSteal;
		
		// move params
		if ( typeof stealData == 'object') {
			window.steal = stealData;
		}else{
			cb = stealData;
		}
	
		// what gets called by steal.done
		// rootSteal the 'master' steal
		var doneCb = function(rootSteal){
			// get the 'base' steal (what was stolen)
			
			// callback with the following
			cb({
				/**
				 * @hide
				 * Goes through each steal and gives its content.
				 * How will this work with packages?
				 * 
				 * @param {Function} [filter] the tag to get
				 * @param {Boolean} [depth] the tag to get
				 * @param {Object} func a function to call back with the element and its content
				 */
				each: function( filter, depth, func ) {
					// reset touched
					touched = {};
					// move params
					if ( !func ) {
						
						if( depth === undefined ) {
							depth = false;
							func = filter;
							filter = function(){return true;};
						} else if( typeof filter == 'boolean'){
							func = depth;
							depth = filter
							filter = function(){return true;};
						} else if(arguments.length == 2 && typeof filter == 'function' && typeof depth == 'boolean'){
							func = filter;
							filter = function(){return true;};
						} else {  // filter given, no depth
							func = depth;
							depth = false;
							
						}
					};
					
					// make this filter by type
					if(typeof filter == 'string'){
						var resource = filter;
						filter = function(stl){
							return stl.options.buildType === resource;
						}
					}
					var items = [];
					// iterate 
					iterate(rootSteal, function(resource){
						
						if( filter(resource) ) {
							resource.options.text = resource.options.text || loadScriptText(resource);
							func(resource.options, resource );
							items.push(resource.options);
						}
					}, depth, includeFns );
				},
				// the 
				steal: newSteal,
				url: url,
				rootSteal : rootSteal,
				firstSteal : s.build.open.firstSteal(rootSteal)
			})
		};

		var html = fs.readFileSync(url).toString();
		var onload = function(){
			var pageSteal = jsWin.steal;

			if(stealData.skipAll){
				pageSteal.config({
					types: {
						"js" : function(options, success){
							console.log("open.js", "Looking for:");
							var text;
							if(options.text){
								text = options.text;
							}else{
								text = readFile(options.id);
							}
							// check if steal is in this file
							var stealInFile = /steal\(/.test(text);
							if(stealInFile){
								// if so, load it
								eval(text)
							} else {
								// skip this file
							}
							success()
						},
						"fn": function (options, success) {
							// skip all functions
							success();
						}
					}
				})
			}
			// a flag to tell steal we're in "build" mode
			// this is used to completely ignore files with the "ignore" flag set
			pageSteal.isBuilding = true;
			// if there's timers (like in less) we'll never reach next line 
			// unless we bind to done here and kill timers
			pageSteal.one('done', doneCb);
			newSteal = pageSteal;
		};

		var jsDoc = jsdom(html, null, {
			url: process.cwd() + "/app.html", // We have to lie about the URL to get jsdom to work
		});
		var jsWin = jsDoc.createWindow();
		jsWin.XMLHttpRequest = ShimXHR;
		jsWin.addEventListener('load', onload);

		window.steal = oldSteal;
	};

	steal.build.open.firstSteal =function(rootSteal){
		var stel;
		for(var i =0; i < rootSteal.dependencies.length; i++){
			stel = rootSteal.dependencies[i];
			
			if(stel && stel.options.buildType != 'fn' && stel.options.id != 'steal/dev/dev.js' && stel.options.id != 'stealconfig.js'){
				return stel;
			}	
		}
	};
	
	var loadScriptText = function( stl ) {
		var options = stl.options;
		if(options.fn){
			return stl.orig.toString();
		}
		if(options._skip){ // if we skip this script, we don't care about its contents
			return "";
		}
		
		if(options.text){
			return options.text;
		}
		
		// src is relative to the page, we need it relative
		// to the filesystem
		var src = options.src+"",
			text = "",
			base = "" + window.location,
			url = src.match(/([^\?#]*)/)[1];


		
		url = Envjs.uri(url, base);
		
		if ( url.match(/^file\:/) ) {
			url = url.replace("file:/", "");
			text = readFile("/" + url);
		}

		if ( url.match(/^http\:/) ) {
			text = readUrl(url);
		}
		return text;
	};
})
