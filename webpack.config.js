var webpack = require("webpack");
var path = require('path');
var fs = require('fs');
const prod = process.env.NODE_ENV === 'production';

module.exports = {  
    devtool: undefined,
    entry: path.join(process.cwd(), 'src', process.env.ENTRY || 'index'),
    plugins: [
        new webpack.DefinePlugin({ "global.GENTLY": false })
    ].filter(function(i) { return i != null; }),
    target: 'node',
    module: {
        loaders: [
            {
                test: /.*\.ts$/,
                exclude: /node_modules/,
                loader: 'awesome-typescript-loader'
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    output: {
        libraryTarget: 'commonjs',
        path: path.join(process.cwd(), 'build/dist'),
        filename: 'index.js'
    }
};
