// Copies remaining files to places other tasks can use
module.exports = {
  dist: {
    files: [{
      expand: true,
      dot: true,
      cwd: '.',
      dest: '<%= config.dist %>',
      src: [
        'app/*',
        '.htaccess',
        'images/{,*/}*.webp',
        // '{,*/}*.html',
        'styles/fonts/{,*/}*.*'
      ]
    }]
  }
};
