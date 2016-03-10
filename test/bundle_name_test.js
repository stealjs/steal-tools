var assert = require("assert"),
	crypto = require('crypto'),
	winston = require('winston'),
	nameBundle = require("../lib/bundle/name");

var dirName = "bundles/";

describe("bundle name without npm package", function() {
	beforeEach(function () {
	});

	it("works with just a normal modulename", function () {
		var bundle = {
			bundles: ["main"]
		};
		var bundleName = nameBundle.getName(bundle);
		assert.equal(bundleName, dirName + 'main');
	});

	it("remove trailing parts", function () {
		var bundleName = nameBundle.getName({bundles: ["main.js"]});
		assert.equal(bundleName, dirName + 'main');

		bundleName = nameBundle.getName({bundles: ["main/"]});
		assert.equal(bundleName, dirName + 'main');

		//bundleName = nameBundle.getName({bundles: ["foo@1.0.0#bar/"]});
		//assert.equal(bundleName, dirName + 'bar');

	});

	it("works with multiple bundles", function(){
		var bundle = {
			bundles: ["main/bar", "bar/foo"]
		};
		var bundleName = nameBundle.getName(bundle);
		assert.equal(bundleName, dirName + 'bar-foo');

		bundle = {
			bundles: ["main/bar", "bar/foo"],
			buildType: "txt"
		};
		bundleName = nameBundle.getName(bundle);
		assert.equal(bundleName, dirName + 'bar-foo.txt!');
	});

	it("works if buildType is a extension", function(){
		var bundle = {
			bundles: ["main"],
			buildType: "txt"
		};
		nameBundle(bundle);
		assert.equal(bundle.buildType, 'txt');
		assert.equal(bundle.name, dirName + 'main.txt!');
	});

	it("with very long name", function(){
		var count = 0;

		var bundle = {
			bundles: ["deep/folder/structure/with/very/very-very-long-name"]
		};
		var bundleName = nameBundle.getName(bundle);
		assert.equal(bundleName, dirName + 'deep/folder/structure/with/very/very-very-long-name');

		// again...
		bundleName = nameBundle.getName(bundle);
		assert.equal(bundleName, dirName + 'deep/folder/structure/with/very/very-very-long-nam-1-' + (count++));

		bundle = {
			bundles: ["main/my-very-long-name", "bar/eman-gnol-yrev-ym"]
		};
		bundleName = nameBundle.getName(bundle);
		assert.equal(bundleName, dirName + 'my-very-long-nam-34e05993');


		bundle = {
			bundles: ["deep/folder/structure/with/very/very/very-long-name"],
			buildType: "txt"
		};
		nameBundle(bundle);
		assert.equal(bundle.buildType, 'txt');
		assert.equal(bundle.name, dirName + 'deep/folder/structure/with/very/very/very-long-name.txt!');

		// again...
		nameBundle(bundle);
		assert.equal(bundle.name, dirName + 'deep/folder/structure/with/very/very/very-long-nam-1-'+ (count++) +'.txt!');

	});

	it("works with a plugin markup", function() {
		var bundle = {
			bundles: ["index.stache!done-autorender"]
		};
		var bundleName = nameBundle.getName(bundle);
		assert.equal(bundleName, dirName + 'index');

		bundle = {
			bundles: ["main!my-plugin"]
		};
		bundleName = nameBundle.getName(bundle);
		assert.equal(bundleName, dirName + 'main');
	});

});

describe("bundle name with npm package", function() {
	var oldWinstonWarning,
		warns;
	beforeEach(function () {
		oldWinstonWarning = winston.warn;
		warns = [];

		winston.warn = function(msg){
			warns.push(msg);
		};
	});

	afterEach(function(){
		winston.warn = oldWinstonWarning;
	});

	it("works for a package module", function(){
		var bundle = {
			bundles: ["foo@1.0.0#bar"]
		};
		var bundleName = nameBundle.getName(bundle);
		assert.equal(bundleName, dirName + 'foo/bar');
	});

	it("works with multiple bundles", function(){
		var bundle = {
			bundles: ["foo@1.0.0#component/my-component", "foo@1.0.0#foo"]
		};
		var bundleName = nameBundle.getName(bundle);
		assert.equal(bundleName, dirName + 'foo/my-component-foo');
	});

	it("remove trailing parts", function () {
		var bundle = {
			bundles: ["foo@1.0.0#main/bar/", "foo@1.0.0#foo.js"]
		};
		var bundleName = nameBundle.getName(bundle);
		assert.equal(bundleName, dirName + 'foo/bar-foo');
	});

	it("works with a plugin markup", function(){

		var bundle = {
			bundles: ["mypkg@1.0.0#index.stache!done-autorender"]
		};
		var bundleName = nameBundle.getName(bundle);
		assert.equal(bundleName, dirName + 'mypkg/index');

		bundle = {
			bundles: ["mypkg@1.0.0#main!my-plugin"]
		};
		bundleName = nameBundle.getName(bundle);
		assert.equal(bundleName, dirName + 'mypkg/main');
	});

	it("should show a warning if one of the bundles is not npm like", function(){
		var bundle = {
			bundles: ["foo@1.0.0#main", "main"]
		};
		var bundleName = nameBundle.getName(bundle);
		assert.equal(bundleName, dirName + 'foo/main-main');
		// check warning
		assert.equal(warns.pop(), "There is two or more different package names inside the bundles array." +
			"The destination folder is set to "+dirName+"/foo");
	});

	it("should show a warning if in bundles array are two or more diffrent package names", function(){
		var bundle = {
			bundles: ["mypkg@1.0.0#main", "jquery@1.0.0#lib/index"]
		};
		var bundleName = nameBundle.getName(bundle);
		assert.equal(bundleName, dirName + 'mypkg/main-index');
		// check warning
		assert.equal(warns.pop(), "There is two or more different package names inside the bundles array." +
			"The destination folder is set to "+dirName+"/mypkg");
	});

});
