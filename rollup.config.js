import { terser } from "rollup-plugin-terser";
import resolve from "@rollup/plugin-node-resolve";

const PLUGINS = [resolve({ moduleDirectories: ["node_modules"] })];
const EXTERNAL = ["single-filez-core"];

export default [{
	input: ["single-filez-core/index.js"],
	output: [{
		file: "lib/single-file.js",
		format: "umd",
		name: "singlefile",
		plugins: [terser()]
	}],
	plugins: PLUGINS,
	external: EXTERNAL
}, {
	input: ["single-filez-core/processors/frame-tree/content/content-frame-tree.js"],
	output: [{
		file: "lib/single-file-frames.js",
		format: "umd",
		name: "singlefile",
		plugins: [terser()]
	}],
	plugins: PLUGINS,
	external: EXTERNAL
}, {
	input: ["single-filez-core/single-file-bootstrap.js"],
	output: [{
		file: "lib/single-file-bootstrap.js",
		format: "umd",
		name: "singlefileBootstrap",
		plugins: [terser()]
	}],
	plugins: PLUGINS,
	external: EXTERNAL
}, {
	input: ["single-filez-core/processors/hooks/content/content-hooks-web.js"],
	output: [{
		file: "lib/single-file-hooks.js",
		format: "iife",
		plugins: [terser()]
	}],
	plugins: PLUGINS,
	external: EXTERNAL
}, {
	input: ["single-filez-core/processors/hooks/content/content-hooks-frames-web.js"],
	output: [{
		file: "lib/single-file-hooks-frames.js",
		format: "iife",
		plugins: [terser()]
	}],
	plugins: PLUGINS,
	external: EXTERNAL
}, {
	input: ["single-filez-core/common/content-infobar-web.js"],
	output: [{
		file: "lib/single-file-infobar.js",
		format: "iife",
		plugins: [terser()]
	}],
	plugins: PLUGINS,
	external: EXTERNAL
}, {
	input: ["single-filez-core/vendor/zip/zip.min.js"],
	output: [{
		file: "lib/single-file-zip.min.js",
		format: "es",
		plugins: [terser()]
	}],
	context: "this",
	plugins: PLUGINS,
	external: EXTERNAL
}];