const path = require('path');

module.exports = {
  entry: {
    main: './src/index.js',
    worker: './src/worker/index.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  module:{
    rules: [
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: ['file-loader'],
      }
    ],
  },
  node: {
    fs: "empty"
  },
};