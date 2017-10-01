var assert = require("assert");
var minify = require("../lib/build_types/minify_js").sync;

describe("minify js", function() {
	it("generates sourcemaps when option is set", function() {
		var result = minify({ code: "var a = 1;" }, { sourceMaps: true });
		assert.ok(result.map, "should return a map");
	});

	it("map includes the source when option is set", function() {
		var result = minify({ code: "var a = 1;" }, {
			sourceMaps: true,
			sourceMapsContent: true
		});

		assert.ok(
			JSON.parse(result.map).sourcesContent,
			"should include sourcesContent property"
		);
	});

	it("sets input sourcemap", function() {
		var map = {
			"version": 3,
			"sources": ["index.js"],
			"names": [],
			"mappings": ";;AAAA,IAAI,MAAM,SAAN,GAAM;AAAA,SAAK,SAAS,CAAd;AAAA,CAAV;AACA,QAAQ,GAAR,CAAY,IAAI,KAAJ,CAAZ",
			"file": "bundle.js",
			"sourcesContent": ["let foo = x => \"foo \" + x;\nconsole.log(foo(\"bar\"));"]
		};

        var transpiled = '"use strict";\n\n' +
            'var foo = function foo(x) {\n  return "foo " + x;\n};\n' +
            'console.log(foo("bar"));\n\n' +
            '//# sourceMappingURL=bundle.js.map';

        var result = minify({ code: transpiled, map: map }, { sourceMaps: true });

		assert.equal(
			JSON.parse(result.map).file,
			"index.js",
			"minify should compose the existing map"
		);
	 });
});
