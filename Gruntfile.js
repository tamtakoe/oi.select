module.exports = function(grunt) {
    "use strict";

    var path = require('path');

    grunt.initConfig({
        publicPath: path.resolve('.'),
        srcPath: '<%= publicPath %>/src',

        connect: {
            options: {
                hostname: 'multiselect.local',
                middleware: function(connect, options) {
                    return [
                        connect.static(options.base)
                    ];
                }
            },
            development: {
                options: {
                    port: 3000,
                    base: '<%= publicPath %>'
                }
            }
        },

        stylus: {
            options: {
                use: [
                    function() {
                        return require('autoprefixer-stylus')("ff >= 20", "chrome >= 20", "safari >= 6", "ios >= 6", "android >= 4", "opera >= 12.1", "ie >= 10");
                    }
                ],
                import: ['<%= publicPath %>/template/**/*.styl']
            },

            compile: {
                files: {
                    '<%= publicPath %>/style.css': ['<%= publicPath %>/template/**/*.styl']
                }
            }
        },

        watch: {
            stylus: {
                files: '<%= publicPath %>/template/**/*.styl',
                tasks: 'stylus'
            }//,
            // TODO: Implement more magiciful live reload
//            livereload: {
//                // Here we watch the files the sass task will compile to
//                // These files are sent to the live reload server after sass compiles to them
//                options: {
//                    livereload: true
//                },
//                files: ['<%= compiledPath %>/**/*']
//            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-stylus');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['stylus', 'connect', 'watch']);
};
