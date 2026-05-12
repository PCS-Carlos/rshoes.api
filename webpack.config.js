var path = require('path');
var fs = require('fs');
const Dotenv = require('dotenv-webpack');

module.exports = (env) => {
  const environment = env.production ? 'production' : 'development';
  const candidates = [
    `./env/.env.${environment}`,
    `./.env.${environment}`,
    './.env',
  ];
  const dotenvPath = candidates.find((candidate) => fs.existsSync(path.resolve(__dirname, candidate)));
  console.log(`dotenv path: ${dotenvPath || 'system env only'}`);

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
        path: dotenvPath,
        systemvars: true,
        silent: true,
      }),
    ],
  };
};