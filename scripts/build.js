"use strict";

const fs = require("fs-extra");
const path = require("path");
const webpack = require("webpack");
const config = require("../webpack.config");
const blocksConfig = require("../blocks.webpack.config");
const buildFolder = path.resolve(__dirname, "../build");

config.plugins.push(function () {
  this.hooks.done.tapAsync("done", function (stats, callback) {
    if (stats.compilation.errors.length > 0) {
      throw new Error(
        stats.compilation.errors.map(err => err.message || err)
      );
    }
    callback();
  });
});

const start = async () => {
  /**
     * Empty dir
     */
  fs.emptyDirSync(buildFolder);

  /**
   * Run webpack
   */
  webpack(config).run(() => {
    /**
     * Run blocks webpack
     */
    webpack(blocksConfig).run(() => {
      console.log("Blocks build completed.");
    });
  });
}

start();