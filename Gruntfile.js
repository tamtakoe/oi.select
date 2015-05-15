module.exports = function(grunt) {
    "use strict";

    grunt.initConfig({
        publicPath: require('path').resolve('.'),
        srcPath:    '<%= publicPath %>/src',
        tplsPath:   '<%= publicPath %>/template',
        distPath:   '<%= publicPath %>/dist',

        connect: {
            options: {
                hostname: 'localhost',
                middleware: function(connect, options) {
                    return [
                        require('connect-livereload')(),
                        require('grunt-connect-pushstate/lib/utils').pushState(),
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
                        return require('autoprefixer-stylus')("ff >= 20", "chrome >= 20", "safari >= 6", "ios >= 6", "android >= 4", "opera >= 12.1", "ie >= 9");
                    }
                ]
            },
            compile: {
                files: {
                    '<%= distPath %>/multiselect.css': ['<%= publicPath %>/template/**/*.styl']
                }
            }
        },

        clean: {
            dist: {
                src: '<%= distPath %>'
            }
        },

        html2js: {
            dist: {
                options: {
                    module: 'oi.multiselect',
                    base: '.'
                },
                files: [{
                    src: ['<%= tplsPath %>/multiselect/template.html'],
                    dest: '<%= distPath %>/multiselect-tpls.js'
                }]
            }
        },

        concat: {
            multiselect: {
                src:  [ '<%= srcPath %>/select/module.js',
                    '<%= srcPath %>/select/services.js',
                    '<%= srcPath %>/select/directives.js',
                    '<%= srcPath %>/select/filters.js'],
                dest: '<%= distPath %>/multiselect.js'
            },
            multiselectTpls: {
                src:  [ '<%= distPath %>/multiselect-tpls.js',
                    '<%= srcPath %>/select/services.js',
                    '<%= srcPath %>/select/directives.js',
                    '<%= srcPath %>/select/filters.js'],
                dest: '<%= distPath %>/multiselect-tpls.js'
            }
        },

        cssmin: {
            options: {
                keepSpecialComments: 0
            },
            multiselect: {
                src: '<%= distPath %>/multiselect.css',
                dest: '<%= distPath %>/multiselect.min.css'
            }
        },

        uglify: {
            multiselect: {
                files: {
                    '<%= distPath %>/multiselect.min.js': '<%= distPath %>/multiselect.js',
                    '<%= distPath %>/multiselect-tpls.min.js': '<%= distPath %>/multiselect-tpls.js'
                }
            }
        },

        watch: {
            stylus:     {
                files: '<%= publicPath %>/template/**/*.styl',
                tasks: 'stylus'
            },
            livereload: {
                options: {
                    livereload: true
                },
                files:   ['<%= distPath %>/multiselect.css']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-stylus');
    grunt.loadNpmTasks('grunt-html2js');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('build', ['clean', 'stylus', 'html2js', 'concat', 'cssmin', 'uglify']);
    grunt.registerTask('default', ['stylus', 'connect', 'watch']);
};