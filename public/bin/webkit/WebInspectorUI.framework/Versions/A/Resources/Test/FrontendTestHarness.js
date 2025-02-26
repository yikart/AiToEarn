/*
 * Copyright (C) 2013-2016 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

FrontendTestHarness = class FrontendTestHarness extends TestHarness
{
    constructor()
    {
        super();

        this._results = [];
        this._testPageHasLoaded = false;

        // Options that are set per-test for debugging purposes.
        this.dumpActivityToSystemConsole = false;
    }

    // TestHarness Overrides

    completeTest()
    {
        if (this.dumpActivityToSystemConsole)
            InspectorFrontendHost.unbufferedLog("completeTest()");

        // Wait for results to be resent before requesting completeTest(). Otherwise, messages will be
        // queued after pending dispatches run to zero and the test page will quit before processing them.
        if (this._testPageIsReloading) {
            this._completeTestAfterReload = true;
            return;
        }

        InspectorBackend.runAfterPendingDispatches(this.evaluateInPage.bind(this, "TestPage.completeTest()"));
    }

    addResult(message)
    {
        let stringifiedMessage = TestHarness.messageAsString(message);

        // Save the stringified message, since message may be a DOM element that won't survive reload.
        this._results.push(stringifiedMessage);

        if (this.dumpActivityToSystemConsole)
            InspectorFrontendHost.unbufferedLog(stringifiedMessage);

        if (!this._testPageIsReloading)
            this.evaluateInPage(`TestPage.addResult(unescape("${escape(stringifiedMessage)}"))`);
    }

    debugLog(message)
    {
        let stringifiedMessage = TestHarness.messageAsString(message);

        if (this.dumpActivityToSystemConsole)
            InspectorFrontendHost.unbufferedLog(stringifiedMessage);

        this.evaluateInPage(`TestPage.debugLog(unescape("${escape(stringifiedMessage)}"));`);
    }

    evaluateInPage(expression, callback, options = {})
    {
        let remoteObjectOnly = !!options.remoteObjectOnly;
        let target = WI.assumingMainTarget();

        // If we load this page outside of the inspector, or hit an early error when loading
        // the test frontend, then defer evaluating the commands (indefinitely in the former case).
        if (this._originalConsole && (!target || !target.hasDomain("Runtime"))) {
            this._originalConsole["error"]("Tried to evaluate in test page, but connection not yet established:", expression);
            return;
        }

        // Return primitive values directly, otherwise return a WI.RemoteObject instance.
        function translateResult(result) {
            let remoteObject = WI.RemoteObject.fromPayload(result);
            return (!remoteObjectOnly && remoteObject.hasValue()) ? remoteObject.value : remoteObject;
        }

        let response = target.RuntimeAgent.evaluate.invoke({expression, objectGroup: "test", includeCommandLineAPI: false});
        if (callback && typeof callback === "function") {
            response = response.then(({result, wasThrown}) => callback(null, translateResult(result), wasThrown));
            response = response.catch((error) => callback(error, null, false));
        } else {
            // Turn a thrown Error result into a promise rejection.
            return response.then(({result, wasThrown}) => {
                result = translateResult(result);
                if (result && wasThrown)
                    return Promise.reject(new Error(result.description));
                return Promise.resolve(result);
            });
        }
    }

    debug()
    {
        this.dumpActivityToSystemConsole = true;
        InspectorBackend.dumpInspectorProtocolMessages = true;
    }

    // Frontend test-specific methods.

    expectNoError(error)
    {
        if (error) {
            InspectorTest.log("PROTOCOL ERROR: " + error);
            InspectorTest.completeTest();
            throw "PROTOCOL ERROR";
        }
    }

    deferOutputUntilTestPageIsReloaded()
    {
        console.assert(!this._testPageIsReloading);
        this._testPageIsReloading = true;
    }

    testPageDidLoad()
    {
        if (this.dumpActivityToSystemConsole)
            InspectorFrontendHost.unbufferedLog("testPageDidLoad()");

        this._testPageIsReloading = false;
        if (this._testPageHasLoaded)
            this._resendResults();
        else
            this._testPageHasLoaded = true;

        this.dispatchEventToListeners(FrontendTestHarness.Event.TestPageDidLoad);

        if (this._completeTestAfterReload)
            this.completeTest();
    }

    reloadPage(options = {})
    {
        console.assert(!this._testPageIsReloading);
        console.assert(!this._testPageReloadedOnce);

        this._testPageIsReloading = true;

        let {ignoreCache, revalidateAllResources} = options;
        ignoreCache = !!ignoreCache;
        revalidateAllResources = !!revalidateAllResources;

        let target = WI.assumingMainTarget();
        return target.PageAgent.reload.invoke({ignoreCache, revalidateAllResources})
            .then(() => {
                this._testPageReloadedOnce = true;

                return Promise.resolve(null);
            });
    }

    redirectRequestAnimationFrame()
    {
        console.assert(!this._originalRequestAnimationFrame);
        if (this._originalRequestAnimationFrame)
            return;

        this._originalRequestAnimationFrame = window.requestAnimationFrame;
        this._requestAnimationFrameCallbacks = new Map;
        this._nextRequestIdentifier = 1;

        window.requestAnimationFrame = (callback) => {
            let requestIdentifier = this._nextRequestIdentifier++;
            this._requestAnimationFrameCallbacks.set(requestIdentifier, callback);
            if (this._requestAnimationFrameTimer)
                return requestIdentifier;

            let dispatchCallbacks = () => {
                let callbacks = this._requestAnimationFrameCallbacks;
                this._requestAnimationFrameCallbacks = new Map;
                this._requestAnimationFrameTimer = undefined;
                let timestamp = window.performance.now();
                for (let callback of callbacks.values())
                    callback(timestamp);
            };

            this._requestAnimationFrameTimer = setTimeout(dispatchCallbacks, 0);
            return requestIdentifier;
        };

        window.cancelAnimationFrame = (requestIdentifier) => {
            if (!this._requestAnimationFrameCallbacks.delete(requestIdentifier))
                return;

            if (!this._requestAnimationFrameCallbacks.size) {
                clearTimeout(this._requestAnimationFrameTimer);
                this._requestAnimationFrameTimer = undefined;
            }
        };
    }

    redirectConsoleToTestOutput()
    {
        // We can't use arrow functions here because of 'arguments'. It might
        // be okay once rest parameters work.
        let self = this;
        function createProxyConsoleHandler(type) {
            return function() {
                self.addResult(`${type}: ` + Array.from(arguments).join(" "));
            };
        }

        function createProxyConsoleTraceHandler(){
            return function() {
                try {
                    throw new Exception();
                } catch (e) {
                    // Skip the first frame which is added by this function.
                    let frames = e.stack.split("\n").slice(1);
                    let sanitizedFrames = frames.map(TestHarness.sanitizeStackFrame);
                    self.addResult("TRACE: " + Array.from(arguments).join(" "));
                    self.addResult(sanitizedFrames.join("\n"));
                }
            };
        }

        let redirectedMethods = {};
        for (let key in window.console)
            redirectedMethods[key] = window.console[key];

        for (let type of ["log", "error", "info", "warn"])
            redirectedMethods[type] = createProxyConsoleHandler(type.toUpperCase());

        redirectedMethods["trace"] = createProxyConsoleTraceHandler();

        this._originalConsole = window.console;
        window.console = redirectedMethods;
    }

    reportUnhandledRejection(error)
    {
        let message = error.message;
        let stack = error.stack;
        let result = `Unhandled promise rejection in inspector page: ${message}\n`;
        if (stack) {
            let sanitizedStack = this.sanitizeStack(stack);
            result += `\nStack Trace: ${sanitizedStack}\n`;
        }

        // If the connection to the test page is not set up, then just dump to console and give up.
        // Errors encountered this early can be debugged by loading Test.html in a normal browser page.
        if (this._originalConsole && !this._testPageHasLoaded)
            this._originalConsole["error"](result);

        this.addResult(result);
        this.completeTest();

        // Stop default handler so we can empty InspectorBackend's message queue.
        return true;
    }

    reportUncaughtExceptionFromEvent(message, url, lineNumber, columnNumber)
    {
        // An exception thrown from a timer callback does not report a URL.
        if (url === "undefined")
            url = "global";

        return this.reportUncaughtException({message, url, lineNumber, columnNumber});
    }

    reportUncaughtException({message, url, lineNumber, columnNumber, stack, code})
    {
        let result;
        let sanitizedURL = TestHarness.sanitizeURL(url);
        let sanitizedStack = this.sanitizeStack(stack);
        if (url || lineNumber || columnNumber)
            result = `Uncaught exception in Inspector page: ${message} [${sanitizedURL}:${lineNumber}:${columnNumber}]\n`;
        else
            result = `Uncaught exception in Inspector page: ${message}\n`;

        if (stack)
            result += `\nStack Trace:\n${sanitizedStack}\n`;
        if (code)
            result += `\nEvaluated Code:\n${code}`;

        // If the connection to the test page is not set up, then just dump to console and give up.
        // Errors encountered this early can be debugged by loading Test.html in a normal browser page.
        if (this._originalConsole && !this._testPageHasLoaded)
            this._originalConsole["error"](result);

        this.addResult(result);
        this.completeTest();
        // Stop default handler so we can empty InspectorBackend's message queue.
        return true;
    }

    // Private

    _resendResults()
    {
        console.assert(this._testPageHasLoaded);

        if (this.dumpActivityToSystemConsole)
            InspectorFrontendHost.unbufferedLog("_resendResults()");

        this.evaluateInPage("TestPage.clearOutput()");
        for (let result of this._results)
            this.evaluateInPage(`TestPage.addResult(unescape("${escape(result)}"))`);
    }
};

FrontendTestHarness.Event = {
    TestPageDidLoad: "frontend-test-test-page-did-load"
};
