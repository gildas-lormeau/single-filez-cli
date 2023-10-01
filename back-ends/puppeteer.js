/*
 * Copyright 2010-2020 Gildas Lormeau
 * contact : gildas.lormeau <at> gmail.com
 * 
 * This file is part of SingleFile.
 *
 *   The code in this file is free software: you can redistribute it and/or 
 *   modify it under the terms of the GNU Affero General Public License 
 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
 *   of the License, or (at your option) any later version.
 * 
 *   The code in this file is distributed in the hope that it will be useful, 
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
 *   General Public License for more details.
 *
 *   As additional permission under GNU AGPL version 3 section 7, you may 
 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
 *   AGPL normally required by section 4, provided you include this license 
 *   notice and a URL through which recipients can access the Corresponding 
 *   Source.
 */

/* global singlefile, require, exports */

const puppeteer = require("puppeteer-core");
const scripts = require("./common/scripts.js");

const EXECUTION_CONTEXT_DESTROYED_ERROR = "Execution context was destroyed";
const NETWORK_IDLE_STATE = "networkidle0";
const NETWORK_STATES = ["networkidle0", "networkidle2", "load", "domcontentloaded"];

let browser, context;

exports.initialize = async options => {
	if (options.browserServer) {
		browser = await puppeteer.connect({ browserWSEndpoint: options.browserServer });
	} else {
		browser = await puppeteer.launch(getBrowserOptions(options));
	}
	return browser;
};

exports.getPageData = async (options, page) => {
	const privatePage = !page;
	try {
		if (privatePage) {
			const contextOptions = {};
			if (options.httpProxyServer) {
				contextOptions.proxyServer = options.httpProxyServer;
			}
			context = await browser.createIncognitoBrowserContext(contextOptions);
			page = await context.newPage();
		}
		await setPageOptions(page, options);
		return await getPageData(context || browser, page, options);
	} finally {
		if (privatePage && !options.browserDebug) {
			await page.close();
		}
	}
};

exports.closeBrowser = () => {
	if (browser) {
		return browser.close();
	}
};

function getBrowserOptions(options = {}) {
	const browserOptions = {};
	if (options.browserHeadless !== undefined) {
		browserOptions.headless = options.browserHeadless && !options.browserDebug;
	}
	if (options.browserIgnoreInsecureCerts !== undefined) {
		browserOptions.ignoreHTTPSErrors = options.browserIgnoreInsecureCerts;
	}
	browserOptions.args = options.browserArgs ? JSON.parse(options.browserArgs) : [];
	if (options.browserDisableWebSecurity === undefined || options.browserDisableWebSecurity) {
		browserOptions.args.push("--disable-web-security");
	}
	browserOptions.args.push("--no-pings");
	if (!options.browserStartMinimized && options.browserDebug) {
		browserOptions.args.push("--auto-open-devtools-for-tabs");
	}
	if (options.browserWidth && options.browserHeight) {
		browserOptions.args.push("--window-size=" + options.browserWidth + "," + options.browserHeight);
	}
	browserOptions.executablePath = options.browserExecutablePath || "chrome";
	if (options.userAgent) {
		browserOptions.args.push("--user-agent=" + options.userAgent);
	}
	return browserOptions;
}

async function setPageOptions(page, options) {
	if (options.browserWidth && options.browserHeight) {
		await page.setViewport({
			width: options.browserWidth,
			height: options.browserHeight
		});
	}
	if (options.browserBypassCSP === undefined || options.browserBypassCSP) {
		await page.setBypassCSP(true);
	}
	if (options.httpHeaders) {
		page.setExtraHTTPHeaders(options.httpHeaders);
	}
	if (options.browserStartMinimized) {
		const session = await page.target().createCDPSession();
		const { windowId } = await session.send("Browser.getWindowForTarget");
		await session.send("Browser.setWindowBounds", { windowId, bounds: { windowState: "minimized" } });
	}
	if (options.browserCookies && options.browserCookies.length) {
		await page.setCookie(...options.browserCookies);
	}
	if (options.emulateMediaFeatures) {
		await page.emulateMediaFeatures(options.emulateMediaFeatures);
	}
	if (options.httpProxyServer && (options.httpProxyUsername || options.httpProxyPassword)) {
		await page.authenticate({
			username: options.httpProxyUsername,
			password: options.httpProxyPassword
		});
	}
}

async function getPageData(context, page, options) {
	const injectedScript = await scripts.get(options);
	await page.evaluateOnNewDocument(injectedScript);
	if (options.browserDebug) {
		await page.waitForTimeout(3000);
	}
	try {
		await pageGoto(page, options);
	} catch (error) {
		if (options.browserWaitUntilFallback && error.name == "TimeoutError") {
			const browserWaitUntil = NETWORK_STATES[(NETWORK_STATES.indexOf(options.browserWaitUntil) + 1)];
			if (browserWaitUntil) {
				options.browserWaitUntil = browserWaitUntil;
				return getPageData(context, page, options);
			} else {
				throw error;
			}
		} else if (error.name != "TimeoutError") {
			throw error;
		}
	}
	try {
		if (options.browserWaitDelay) {
			await page.waitForTimeout(options.browserWaitDelay);
		}
		const pageData = await page.evaluate(async options => {
			options.compressContent = true;
			const pageData = await singlefile.getPageData(options);
			return pageData;
		}, options);
		pageData.content = new Uint8Array(pageData.content);
		return pageData;
	} catch (error) {
		if (error.message && error.message.includes(EXECUTION_CONTEXT_DESTROYED_ERROR)) {
			const pageData = await handleJSRedirect(context, options);
			if (pageData) {
				return pageData;
			} else {
				throw error;
			}
		} else {
			throw error;
		}
	}
}

async function handleJSRedirect(context, options) {
	const pages = await context.pages();
	const page = pages[1] || pages[0];
	try {
		await pageGoto(page, options);
	} catch (error) {
		if (error.name != "TimeoutError") {
			throw error;
		}
	}
	const url = page.url();
	if (url != options.url) {
		options.url = url;
		await context.close();
		return exports.getPageData(options);
	}
}

async function pageGoto(page, options) {
	const loadOptions = {
		timeout: options.browserLoadMaxTime || 0,
		waitUntil: options.browserWaitUntil || NETWORK_IDLE_STATE
	};
	if (options.content) {
		await page.goto(options.url, { waitUntil: "domcontentloaded" });
		await page.setContent(options.content, loadOptions);
	} else {
		await page.goto(options.url, loadOptions);
	}
}