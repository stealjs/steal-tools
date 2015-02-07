@page steal-tools.guides.progressive_loading Progressive Loading
@parent StealJS.guides 1

Single page apps and regular web pages typically load several, sometimes dozens, of javascript files which causes long initial page load times.
Concatenating and minifying your scripts can help but the web page still loads files it doesn't need. Progressive loading solves this problem by loading only the scripts required and lazy loading the remaining files as needed. The example app below demonstrates a basic single page app with progressive loading.

This guide is a step-by-step guide to create the app from scratch, or you can clone the source from the [GitHub Quick Start repo](https://github.com/stealjs/progressive-loading).

## Setup

This basic single page app demonstrates progressive loading. It uses a common file structure, but Steal supports a wide variety of other configuration options which can be found [steal here].

To get started, ensure [Node.js](http://nodejs.org/) and [bower](http://bower.io/) are properly installed on your computer, then initialize a `package.json` and install [steal-tools].

	> npm init
	> npm install steal-tools --save-dev

Next, initialize `bower` and install `jquery` and `steal`.

	> bower init
	> bower install jquery --save
	> bower install steal --save


If you already have a webserver running locally, you can skip this step. If you don't have a web server, install this simple command-line [http-server](https://www.npmjs.com/package/http-server) to help you get started.

	> npm install http-server -g

## Create your modules

Create a main module that loads only the bare minimum to determine what "page" you are on. A bare bones example might have a file structure like:

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


Create `app.js` which imports jquery using ES6 module syntax. We'll use the `hashchange` as a simple mechanism to
track the state of our app. So create an event handler which listens to the `hashchange` event. The hashes`#login`, `signup` and `#homepage` coorespond to a state or "page". Steal-tools will load only the files needed for each state.

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

## Create your page

Now we'll create the `site.html` page which loads `steal.js`. The `data-main` and `data-config` attributes tell steal to load `config.js`, and `app.js`.

`site.html`
    
	<div id="main"></div>

	<ul>
		<li><a href='#homepage'>home page</a></li>
		<li><a href='#signup'>sign up</a></li>
		<li><a href='#login'>log in</a></li>
	</ul>

	<script src="../bower_components/steal/steal.js"
			data-main="app"
			data-config="./config.js"
			></script>

This is the development mode which progressively loads the scripts but doesn't use the concatenated or minified versions.

## Build your site

From your main folder, run:

    > ./node_modules/steal-tools/bin/steal build --main=app --config=site/config.js

The path to `config.js` must be relative to your cwd. This command generates a bundle `site/dist/bundles`.
The directory should have a file structure like:

    site/dist/bundles/
      app.js
      homepage.js
      signup.js
      login.js

Open site.html in your browser, and open the Network panel in the Developer Tools. As you click on the "home page", "sign up" and "log in" links you'll notice the individual scripts loading as needed. This is progressive loading in action. Only the necessary scripts were loaded initially, the remaining scripts are loaded as needed. If you want to control number of scripts in a bundle, you can configure it like:

    > ./node_modules/steal-tools/bin/steal build --main=app --config=site/config.js --bundleDepth=3

## See it live

For production, add `data-env="production"` attribute to your script tag. This tells Steal to use the concatenated and minified versions of the files:

    <div id="main"></div>
    <script src="../bower_components/steal/steal.js"
            data-main="app"
            data-config="./config"
            data-env="production"></script>

Again, open the `site.html` in a browser and view the Network tab in the Developer Tools. You notice `app.js` now contains a minified and concatenated version of jquery and config.js. And the `homepage.js`, `signup.js` and `login.js` are only loaded when needed.