@page steal-tools.guides.progressive_loading Progressive Loading
@parent StealJS.guides 1

If you have a large single page app, you may want to progressively load parts 
of the app.  Here's how you might do that:

## Setup

This simple single page app demonstrates progressive loading. It uses a common but simple file structure, but Steal supports a wide variety of other configuration options which can be found [steal here].

To get started, ensure [Node.js](http://nodejs.org/) and [bower](http://bower.io/) are installed on your computer.
Initialize a `package.json` and install [steal-tools].

	> npm init
	> npm install steal-tools --save-dev

Next, initialize `bower` and install `jquery` and `steal`.

	> bower init
	> bower install jquery --save
	> bower install steal --save


## Create your modules
Create a main module that loads only the bare minimum to determine what "page" you
are on. A bare bones example might have a file structure like:

    bower_components/
      steal/
        steal.js
      jquery/
        jquery.js
    node_modules/
      steal-tools/
    site/
      app.js
      config.js
      homepage.js
      login.js
      signup.js
      site.html


Create `app.js` which import jquery using ES6 module syntax. And create an event handles which listens to the `hashchange` event.

`app.js`

	import $ from 'jquery';
	$(function(){
	  var onhashchange = function(){
		if(window.location.hash === "#login") {
		  System.import("login").then(function(){
			$("#main").login();
		  });
		} else if(window.location.hash === "#signup" ) {
		  System.import("signup").then(function(){
			$("#main").signup();
		  });
		} else {
		  System.import("homepage").then(function(){
			$("#main").homepage();
		  });
		}
	  };
	  $(window).bind("hashchange",onhashchange);
	  onhashchange();
	});

`homepage.js`

	define(['jquery'], function($){
	  return $.fn.homepage = function(){
		this.html("<h1>Homepage</h1>");
	  };
	});
    
`signup.js`

	module.exports = $.fn.signup = function(){
	  this.html("<h1>Signup</h1>");
	};

`login.js`

	module.exports = $.fn.login = function() {
	  this.html("<h1>Login</h1>");
	};

`config.js`

	System.bundle = ["homepage","signup","login"];
	System.paths.jquery = "../bower_components/jquery/dist/jquery.js";

## Write out your page

The following will load `steal.js`, `config.js` and `app.js`

`site.html`
    
    <div id="main"></div>
    <script src="../bower_components/steal/steal.js"
            data-main="app"
            data-config="./config.js"></script>

## Build your site

From your main folder, run:

    > steal-tools build main=app config=site/config.js

Notice that the path to config must be relative to your cwd. This will create a 
`site/bundles` directory with the following contents:

    site/bundles/
      app.js
      homepage.js
      signup.js
      login.js

If you want to limit the number of scripts any bundle might load, configure that like:

    > steal-tools build main=app config=site/config bundleDepth=3

## See it live

If you add `data-env="production"` to your site, you can see it live:

    <div id="main"></div>
    <script src="../bower_components/steal/steal.js"
            data-main="app"
            data-config="./config"
            data-env="production"></script>
