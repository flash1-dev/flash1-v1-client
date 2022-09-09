const path = require("path");

const config = {
  target: "web",
  entry: {
    index: "./src/index.ts",
  },
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "bundle.js",
    library: "v1client",
    libraryTarget: "umd",
    globalObject: "this",
    umdNamedDefine: true,
  },
  watchOptions: {
    aggregateTimeout: 600,
    ignored: /node_modules/,
  },
  module: {
    rules: [
      {
        test: /\.ts(x?)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env"],
            },
          },
          {
            loader: "ts-loader",
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    fallback: {
      "stream": require.resolve("stream-browserify"),
      "crypto": require.resolve("crypto-browserify"),
      "assert": require.resolve("assert"),
      "http": require.resolve("stream-http"),
      "url": require.resolve("url"),
      "os": require.resolve("os-browserify/browser"),
      "https": require.resolve("https-browserify")
    }
  },
};

module.exports = (env, argv) => {
  if (argv.mode === "development") {
  } else if (argv.mode === "production") {
  } else {
    throw new Error("Specify env");
  }

  return config;
};
