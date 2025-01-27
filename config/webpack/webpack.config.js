const path = require("path");
const fs = require("fs");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer"); //eslint-disable-line
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const { DefinePlugin, NoEmitOnErrorsPlugin } = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const CaseSensitivePathsPlugin = require("case-sensitive-paths-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ESLintPlugin = require("eslint-webpack-plugin");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

const isDev = process.env.NODE_ENV === "development";

const config = {
    mode: isDev ? "development" : "production",
    entry: {
        client: "./src/index.tsx",
    },
    plugins: [
        // new BundleAnalyzerPlugin(),
        new DefinePlugin({
            "process.env": {
                NODE_ENV: JSON.stringify(process.env.NODE_ENV),
                X_LANG: process.env.X_LANG,
            }
        }),
        new MiniCssExtractPlugin({
            filename: isDev ? "[name].css" : "[name].css", //-[contenthash].css"
        }),
        new NoEmitOnErrorsPlugin(),
        new CaseSensitivePathsPlugin(),
        new HtmlWebpackPlugin({
            template: "src/html/index.html",
            inject: false,
            minify: false,
        }),
        new ESLintPlugin({
            fix: true,
        }),
        !isDev && new CopyPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, "../../public"),
                    to: path.resolve(__dirname, "../../dist"),
                }
            ],
        }),
        isDev && new ReactRefreshWebpackPlugin()
    ].filter(a => a),
    output: {
        path: rel("dist"),
        filename: "[name].js", //-[contenthash].js",
        publicPath: "/",
    },
    optimization: {
        usedExports: true,
        minimize: !isDev,
        minimizer: [
            new TerserPlugin(),
            new CssMinimizerPlugin({
                minimizerOptions: {
                    preset: ["default", { discardComments: { removeAll: true } }],
                },
            }),
        ],
        splitChunks: {
            chunks: "all",
            minSize: 0,
            name: (module, chunks, cacheGroupKey) => cacheGroupKey,
            cacheGroups: {
                antd: {
                    test: /\/node_modules\/antd/,
                    priority: 1,
                },
                drei: {
                    test: /\/node_modules\/@react-three/,
                    priority: 1,
                },
                three: {
                    test: /\/node_modules\/three/,
                    priority: 2,
                },
                vendor: {
                    test: /\/node_modules\//,
                    priority: -10,
                },
                default: false,
            }
        }
    },
    resolve: {
        modules: ["node_modules", "src", "src/css"],
        extensions: [".ts", ".tsx", ".js", ".scss", ".css"],
    },
    devtool: isDev && "source-map",
    devServer: {
        port: process.env.PORT || 3030,
        hot: true,
        static: {
            directory: rel("public")
        },
        historyApiFallback: true,
    },
    module: {
        rules: [
            {
                test: /\.ts|\.tsx$/,
                exclude: /node_modules/,
                use: "ts-loader"
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "babel-loader",
                        options: {}
                    },
                    //this is required to support source maps with typescript
                    isDev && {
                        loader: "source-map-loader",
                    }
                ].filter(a => a),
            },
            {
                test: /\.scss$/,
                use: [
                    isDev && "style-loader",
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            esModule: false,
                        }
                    },
                    {
                        loader: "css-loader",
                        options: {
                            url: false,
                        }
                    },
                    "sass-loader",
                ].filter(a => a),
            },
        ]
    }
};

module.exports = config;
