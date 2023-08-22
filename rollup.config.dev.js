/* global require */

const resolve = require("@rollup/plugin-node-resolve");

const PLUGINS = [resolve({ moduleDirectories: [".."] })];
const EXTERNAL = ["single-filez-core"];

export default [{
	input: ["single-filez-core/single-file.js"],
	output: [{
		file: "lib/single-file.js",
		format: "umd",
		name: "singlefile",
		plugins: []
	}],
	plugins: PLUGINS,
	external: EXTERNAL
}, {
	input: ["single-filez-core/single-file-frames.js"],
	output: [{
		file: "lib/single-file-frames.js",
		format: "umd",
		name: "singlefile",
		plugins: []
	}],
	plugins: PLUGINS,
	external: EXTERNAL
}, {
	input: ["single-filez-core/single-file-bootstrap.js"],
	output: [{
		file: "lib/single-file-bootstrap.js",
		format: "umd",
		name: "singlefileBootstrap",
		plugins: []
	}],
	plugins: PLUGINS,
	external: EXTERNAL
}, {
	input: ["single-filez-core/single-file-hooks-frames.js"],
	output: [{
		file: "lib/single-file-hooks-frames.js",
		format: "iife",
		plugins: []
	}],
	plugins: PLUGINS,
	external: EXTERNAL
}, {
	input: ["single-filez-core/vendor/zip/zip.min.js"],
	output: [{
		file: "lib/single-file-zip.min.js",
		format: "es",
		plugins: []
	}],
	context: "this",
	plugins: PLUGINS,
	external: EXTERNAL
}];