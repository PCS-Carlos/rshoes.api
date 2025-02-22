var path = require('path');
const Dotenv = require('dotenv-webpack');

module.exports = (env) => {
  console.log(`./env/.env.${env.production ? 'production' : 'development'}`)
  return {
    entry: ['./src/index.ts'],
    output: {
      filename: 'api.bundle.js',
      path: path.resolve(__dirname, 'build'),
    },
    module: {
      rules: [
        {test: /\.tsx?$/, loader: 'ts-loader', exclude: /node_modules/},
        {test: /\.json/, loader: 'json-loader', exclude: /node_modules/},
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.json'],
    },
    target: 'node',
    node: {
      __dirname: true,
    },
    plugins: [
        new Dotenv({
        path: `./env/.env.${env.production ? 'production' : 'development'}`
      }),
    ],
  };
};