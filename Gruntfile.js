/* jshint esversion: 6 */

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: ['js/', 'unpacked/'],
    jshint: {
      files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
      options: {
        globals: {
        }
      }
    },
    watch: {
      files: [
        '<%= jshint.files %>', 'package.json'
      ],
      tasks: ['jshint', 'browserify', 'babel', 'uglify']
    },
    browserify: {
      dist: {
        files: {
          'tmp/hardlock.browserify.js': ['src/hardlock.js'],
        }
      }
    },
    babel: {
        options: {
            sourceMap: false,
            presets: ['es2015']
        },
        dist: {
            files: {
                'tmp/hardlock.babel.js': 'tmp/hardlock.browserify.js'
            }
        }
    },
    uglify: {
      options: {
        mangle: {
          except: ['work', 'verify', 'HardLock']
        }
      },
      dist: {
        files: {
          'dist/hardlock.min.js': ['tmp/hardlock.babel.js']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['jshint', 'browserify', 'babel', 'uglify']);
};
