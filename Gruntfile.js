'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    simplemocha: {
      app: {
        src: ['test/test.js']
      }
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      lib: ['lib/**/*.js', 'tasks/**/*.js', 'Gruntfile.js']
    },
    release: {}
  });

  grunt.registerTask('default', 'test');
  grunt.registerTask('test', [ 'jshint', 'simplemocha' ]);

  grunt.loadNpmTasks('grunt-simple-mocha');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-release');
};
