const path = require("path");

module.exports = env => {
  return {
    entry: path.resolve(__dirname, "./client/index.js"),
    output: {
      path: path.resolve(__dirname, "./build"),
      filename: "bundle.js"
    },
    mode: "production",
    module: {
      rules: [
        {
          test: /\.m?js$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react']
            }
          }
        },
        {
          test: /\.s[ac]ss$/i,
          use: [
              'style-loader',
              // Translates CSS into CommonJS
              'css-loader',
              // Compiles Sass to CSS
              'sass-loader',
          ],
        }
      ]          
    }
  }
}