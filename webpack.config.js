const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ZipPlugin = require('zip-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

var PACKAGE = require('./package.json');
var version = PACKAGE.version;

module.exports = {
    mode: 'development',
    devtool: 'source-map',
    entry: {
        background: './src/background.js',
        content: './src/content.js',
        iframe: './src/iframe-content.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                    },
                },
            },
        ],
    },
    resolve: {
        extensions: ['.js'],
    },
    optimization: {
        minimize: false,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    keep_fnames: true,
                },
            }),
        ],
    },
    plugins: [
        new CleanWebpackPlugin(),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: 'src/manifest.json',
                    to: 'manifest.json' // Update the destination path
                },
                {
                    from: 'src/**/*.css',
                    to: 'css/[name][ext]' // Update the destination path
                },
            ],
        }),
        new ZipPlugin({
            path: path.resolve(__dirname, 'dists'),
            filename: `Shopify Better Admin - ${version}.zip`,
        }),
    ],
};
