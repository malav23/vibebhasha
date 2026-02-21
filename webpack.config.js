const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
require('dotenv').config();

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    mode: argv.mode || 'development',
    devtool: isProduction ? false : 'inline-source-map',

    entry: {
      background: './src/background/index.ts',
      'content-script': './src/content-scripts/index.ts',
      popup: './src/popup/popup.ts',
      options: './src/options/options.ts',
    },

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true,
    },

    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
      ],
    },

    resolve: {
      extensions: ['.ts', '.js'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@shared': path.resolve(__dirname, 'src/shared'),
        '@background': path.resolve(__dirname, 'src/background'),
        '@content': path.resolve(__dirname, 'src/content-scripts'),
      },
    },

    plugins: [
      new webpack.DefinePlugin({
        'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL),
        'process.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY),
        'process.env.GOOGLE_OAUTH_CLIENT_ID': JSON.stringify(process.env.GOOGLE_OAUTH_CLIENT_ID),
      }),
      new MiniCssExtractPlugin({
        filename: '[name].css',
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'manifest.json',
            to: 'manifest.json',
            transform(content) {
              return content
                .toString()
                .replace('__GOOGLE_OAUTH_CLIENT_ID__', process.env.GOOGLE_OAUTH_CLIENT_ID || '');
            },
          },
          { from: 'src/popup/popup.html', to: 'popup.html' },
          { from: 'src/options/options.html', to: 'options.html' },
          { from: 'src/popup/popup.css', to: 'popup.css' },
          { from: 'src/options/options.css', to: 'options.css' },
          { from: 'src/content-scripts/content-styles.css', to: 'content-styles.css' },
          { from: 'assets', to: 'assets' },
        ],
      }),
    ],

    optimization: {
      minimize: isProduction,
    },
  };
};
