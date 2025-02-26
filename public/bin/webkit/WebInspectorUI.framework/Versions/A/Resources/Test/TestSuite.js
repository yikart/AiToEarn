/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

TestSuite = class TestSuite
{
    constructor(harness, name) {
        if (!(harness instanceof TestHarness))
            throw new Error("Must pass the test's harness as the first argument.");

        if (typeof name !== "string" || !name.trim().length)
            throw new Error("Tried to create TestSuite without string suite name.");

        this.name = name;
        this._harness = harness;

        this.testcases = [];
        this.runCount = 0;
        this.failCount = 0;
    }

    // Use this if the test file only has one suite, and no handling
    // of the value returned by runTestCases() is needed.
    runTestCasesAndFinish()
    {
        throw new Error("Must be implemented by subclasses.");
    }

    runTestCases()
    {
        throw new Error("Must be implemented by subclasses.");
    }

    get passCount()
    {
        return this.runCount - (this.failCount - this.skipCount);
    }

    get skipCount()
    {
        if (this.failCount)
            return this.testcases.length - this.runCount;
        else
            return 0;
    }

    addTestCase(testcase)
    {
        if (!testcase || !(testcase instanceof Object))
            throw new Error("Tried to add non-object test case.");

        if (typeof testcase.name !== "string" || !testcase.name.trim().length)
            throw new Error("Tried to add test case without a name.");

        if (typeof testcase.test !== "function")
            throw new Error("Tried to add test case without `test` function.");

        if (testcase.setup && typeof testcase.setup !== "function")
            throw new Error("Tried to add test case with invalid `setup` parameter (must be a function).");

        if (testcase.teardown && typeof testcase.teardown !== "function")
            throw new Error("Tried to add test case with invalid `teardown` parameter (must be a function).");

        this.testcases.push(testcase);
    }

    // Protected

    logThrownObject(e)
    {
        let message = e;
        let stack = "(unknown)";
        if (e instanceof Error) {
            message = e.message;
            if (e.stack)
                stack = e.stack;
        }

        if (typeof message !== "string")
            message = JSON.stringify(message);

        let sanitizedStack = this._harness.sanitizeStack(stack);

        let result = `!! EXCEPTION: ${message}`;
        if (stack)
            result += `\nStack Trace: ${sanitizedStack}`;

        this._harness.log(result);
    }
};

AsyncTestSuite = class AsyncTestSuite extends TestSuite
{
    runTestCasesAndFinish()
    {
        let finish = () => { this._harness.completeTest(); };

        this.runTestCases()
            .then(finish)
            .catch(finish);
    }

    runTestCases()
    {
        if (!this.testcases.length)
            throw new Error("Tried to call runTestCases() for suite with no test cases");
        if (this._startedRunning)
            throw new Error("Tried to call runTestCases() more than once.");

        this._startedRunning = true;

        this._harness.log("");
        this._harness.log(`== Running test suite: ${this.name}`);

        // Avoid adding newlines if nothing was logged.
        let priorLogCount = this._harness.logCount;

        return Promise.resolve().then(() => Promise.chain(this.testcases.map((testcase, i) => () => new Promise(async (resolve, reject) => {
            if (i > 0 && priorLogCount < this._harness.logCount)
                this._harness.log("");
            priorLogCount = this._harness.logCount;

            let hasTimeout = testcase.timeout !== -1;
            let timeoutId = undefined;
            if (hasTimeout) {
                let delay = testcase.timeout || 10000;
                timeoutId = setTimeout(() => {
                    if (!timeoutId)
                        return;

                    timeoutId = undefined;

                    this.failCount++;
                    this._harness.log(`!! TIMEOUT: took longer than ${delay}ms`);

                    resolve();
                }, delay);
            }

            try {
                if (testcase.setup) {
                    this._harness.log("-- Running test setup.");
                    priorLogCount++;

                    if (testcase.setup[Symbol.toStringTag] === "AsyncFunction")
                        await testcase.setup();
                    else
                        await new Promise(testcase.setup);
                }

                this.runCount++;

                this._harness.log(`-- Running test case: ${testcase.name}`);
                priorLogCount++;

                if (testcase.test[Symbol.toStringTag] === "AsyncFunction")
                    await testcase.test();
                else
                    await new Promise(testcase.test);

                if (testcase.teardown) {
                    this._harness.log("-- Running test teardown.");
                    priorLogCount++;

                    if (testcase.teardown[Symbol.toStringTag] === "AsyncFunction")
                        await testcase.teardown();
                    else
                        await new Promise(testcase.teardown);
                }
            } catch (e) {
                this.failCount++;
                this.logThrownObject(e);
            }

            if (!hasTimeout || timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = undefined;

                resolve();
            }
        })))
        // Clear result value.
        .then(() => {}));
    }
};

SyncTestSuite = class SyncTestSuite extends TestSuite
{
    addTestCase(testcase)
    {
        if ([testcase.setup, testcase.teardown, testcase.test].some((fn) => fn && fn[Symbol.toStringTag] === "AsyncFunction"))
            throw new Error("Tried to pass a test case with an async `setup`, `test`, or `teardown` function, but this is a synchronous test suite.");

        super.addTestCase(testcase);
    }

    runTestCasesAndFinish()
    {
        this.runTestCases();
        this._harness.completeTest();
    }

    runTestCases()
    {
        if (!this.testcases.length)
            throw new Error("Tried to call runTestCases() for suite with no test cases");
        if (this._startedRunning)
            throw new Error("Tried to call runTestCases() more than once.");

        this._startedRunning = true;

        this._harness.log("");
        this._harness.log(`== Running test suite: ${this.name}`);

        let priorLogCount = this._harness.logCount;
        for (let i = 0; i < this.testcases.length; i++) {
            let testcase = this.testcases[i];

            if (i > 0 && priorLogCount < this._harness.logCount)
                this._harness.log("");
            priorLogCount = this._harness.logCount;

            try {
                // Run the setup action, if one was provided.
                if (testcase.setup) {
                    this._harness.log("-- Running test setup.");
                    priorLogCount++;

                    let setupResult = testcase.setup();
                    if (setupResult === false) {
                        this._harness.log("!! SETUP FAILED");
                        this.failCount++;
                        continue;
                    }
                }

                this.runCount++;

                this._harness.log(`-- Running test case: ${testcase.name}`);
                priorLogCount++;

                let testResult = testcase.test();
                if (testResult === false) {
                    this.failCount++;
                    continue;
                }

                // Run the teardown action, if one was provided.
                if (testcase.teardown) {
                    this._harness.log("-- Running test teardown.");
                    priorLogCount++;

                    let teardownResult = testcase.teardown();
                    if (teardownResult === false) {
                        this._harness.log("!! TEARDOWN FAILED");
                        this.failCount++;
                        continue;
                    }
                }
            } catch (e) {
                this.failCount++;
                this.logThrownObject(e);
            }
        }

        return true;
    }
};
