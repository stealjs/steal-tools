/*[system-bundles-config]*/
System.bundles = {};
/*package.json!npm*/
define('package.json!npm', [
    '@loader',
    'npm-extension',
    'module'
], function (loader, npmExtension, module) {
    npmExtension.addExtension(loader);
    if (!loader.main) {
        loader.main = 'app@1.0.0#index';
    }
    loader._npmExtensions = [].slice.call(arguments, 2);
    (function (loader, packages, options) {
        var g = loader.global;
        if (!g.process) {
            g.process = {
                argv: [],
                cwd: function () {
                    var baseURL = loader.baseURL;
                    return baseURL;
                },
                browser: true,
                env: { NODE_ENV: loader.env },
                version: '',
                platform: navigator && navigator.userAgent && /Windows/.test(navigator.userAgent) ? 'win' : ''
            };
        }
        if (!loader.npm) {
            loader.npm = {};
            loader.npmPaths = {};
            loader.globalBrowser = {};
        }
        if (!loader.npmParentMap) {
            loader.npmParentMap = options.npmParentMap || {};
        }
        var rootPkg = loader.npmPaths.__default = packages[0];
        var rootConfig = rootPkg.steal || rootPkg.system;
        var lib = rootConfig && rootConfig.directories && rootConfig.directories.lib;
        var setGlobalBrowser = function (globals, pkg) {
            for (var name in globals) {
                loader.globalBrowser[name] = {
                    pkg: pkg,
                    moduleName: globals[name]
                };
            }
        };
        var setInNpm = function (name, pkg) {
            if (!loader.npm[name]) {
                loader.npm[name] = pkg;
            }
            loader.npm[name + '@' + pkg.version] = pkg;
        };
        var forEach = function (arr, fn) {
            var i = 0, len = arr.length;
            for (; i < len; i++) {
                res = fn.call(arr, arr[i], i);
                if (res === false)
                    break;
            }
        };
        var setupLiveReload = function () {
            if (loader.liveReloadInstalled) {
                loader['import']('live-reload', { name: module.id }).then(function (reload) {
                    reload.dispose(function () {
                        var pkgInfo = loader.npmContext.pkgInfo;
                        delete pkgInfo[rootPkg.name + '@' + rootPkg.version];
                        var idx = -1;
                        forEach(pkgInfo, function (pkg, i) {
                            if (pkg.name === rootPkg.name && pkg.version === rootPkg.version) {
                                idx = i;
                                return false;
                            }
                        });
                        pkgInfo.splice(idx, 1);
                    });
                });
            }
        };
        var ignoredConfig = [
            'bundle',
            'configDependencies',
            'transpiler'
        ];
        packages.reverse();
        forEach(packages, function (pkg) {
            var steal = pkg.steal || pkg.system;
            if (steal) {
                var main = steal.main;
                delete steal.main;
                var configDeps = steal.configDependencies;
                if (pkg !== rootPkg) {
                    forEach(ignoredConfig, function (name) {
                        delete steal[name];
                    });
                }
                loader.config(steal);
                if (pkg === rootPkg) {
                    steal.configDependencies = configDeps;
                }
                steal.main = main;
            }
            if (pkg.globalBrowser) {
                var doNotApplyGlobalBrowser = pkg.name === 'steal' && rootConfig.builtins === false;
                if (!doNotApplyGlobalBrowser) {
                    setGlobalBrowser(pkg.globalBrowser, pkg);
                }
            }
            var systemName = steal && steal.name;
            if (systemName) {
                setInNpm(systemName, pkg);
            } else {
                setInNpm(pkg.name, pkg);
            }
            if (!loader.npm[pkg.name]) {
                loader.npm[pkg.name] = pkg;
            }
            loader.npm[pkg.name + '@' + pkg.version] = pkg;
            var pkgAddress = pkg.fileUrl.replace(/\/package\.json.*/, '');
            loader.npmPaths[pkgAddress] = pkg;
        });
        setupLiveReload();
        forEach(loader._npmExtensions || [], function (ext) {
            if (ext.systemConfig) {
                loader.config(ext.systemConfig);
            }
        });
    }(loader, [
        {
            'name': 'app',
            'version': '1.0.0',
            'fileUrl': './package.json',
            'main': 'index.js',
            'steal': { 'npmAlgorithm': 'flat' },
            'resolutions': {
                'app': '1.0.0',
                'dep': '1.0.0'
            }
        },
        {
            'name': 'dep',
            'version': '1.0.0',
            'fileUrl': './node_modules/dep/package.json',
            'main': 'main.js',
            'resolutions': {}
        }
    ], { 'npmParentMap': { 'app@1.0.0#folder': 'app@1.0.0#folder/index' } }));
});
/*dep@1.0.0#main*/
define('dep@1.0.0#main', function (require, exports, module) {
    module.exports = 'dep';
});