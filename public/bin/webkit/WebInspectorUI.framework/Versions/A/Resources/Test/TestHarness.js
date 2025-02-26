/*
 * Copyright (C) 2015-2017 Apple Inc. All rights reserved.
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

TestHarness = class TestHarness extends WI.Object
{
    constructor()
    {
        super();

        this._logCount = 0;
        this._failureObjects = new Map;
        this._failureObjectIdentifier = 1;

        // Options that are set per-test for debugging purposes.
        this.forceDebugLogging = false;

        // Options that are set per-test to ensure deterministic output.
        this.suppressStackTraces = false;
    }

    completeTest()
    {
        throw new Error("Must be implemented by subclasses.");
    }

    addResult()
    {
        throw new Error("Must be implemented by subclasses.");
    }

    debugLog()
    {
        throw new Error("Must be implemented by subclasses.");
    }

    // If 'callback' is a function, it will be with the arguments
    // callback(error, result, wasThrown). Otherwise, a promise is
    // returned that resolves with 'result' or rejects with 'error'.

    // The options object accepts the following keys and values:
    // 'remoteObjectOnly': if true, do not unwrap the result payload to a
    // primitive value even if possible. Useful if testing WI.RemoteObject directly.
    evaluateInPage(string, callback, options={})
    {
        throw new Error("Must be implemented by subclasses.");
    }

    debug()
    {
        throw new Error("Must be implemented by subclasses.");
    }

    createAsyncSuite(name)
    {
        return new AsyncTestSuite(this, name);
    }

    createSyncSuite(name)
    {
        return new SyncTestSuite(this, name);
    }

    get logCount()
    {
        return this._logCount;
    }

    log(message)
    {
        ++this._logCount;

        if (this.forceDebugLogging)
            this.debugLog(message);
        else
            this.addResult(message);
    }

    newline()
    {
        this.log("");
    }

    json(object, filter)
    {
        this.log(JSON.stringify(object, filter || null, 2));
    }

    assert(condition, message)
    {
        if (condition)
            return;

        let stringifiedMessage = TestHarness.messageAsString(message);
        this.log("ASSERT: " + stringifiedMessage);
    }

    expectThat(actual, message)
    {
        this._expect(TestHarness.ExpectationType.True, !!actual, message, actual);
    }

    expectTrue(actual, message)
    {
        this._expect(TestHarness.ExpectationType.True, !!actual, message, actual);
    }

    expectFalse(actual, message)
    {
        this._expect(TestHarness.ExpectationType.False, !actual, message, actual);
    }

    expectEmpty(actual, message)
    {
        if (Array.isArray(actual) || typeof actual === "string") {
            this._expect(TestHarness.ExpectationType.Empty, !actual.length, message, actual);
            return;
        }

        if (actual instanceof Set || actual instanceof Map) {
            this._expect(TestHarness.ExpectationType.Empty, !actual.size, message, actual);
            return;
        }

        if (typeof actual === "object") {
            this._expect(TestHarness.ExpectationType.Empty, isEmptyObject(actual), message, actual);
            return;
        }

        this.fail("expectEmpty should not be called with a non-object:\n    Actual: " + this._expectationValueAsString(actual));
    }

    expectNotEmpty(actual, message)
    {
        if (Array.isArray(actual) || typeof actual === "string") {
            this._expect(TestHarness.ExpectationType.NotEmpty, !!actual.length, message, actual);
            return;
        }

        if (actual instanceof Set || actual instanceof Map) {
            this._expect(TestHarness.ExpectationType.NotEmpty, !!actual.size, message, actual);
            return;
        }

        if (typeof actual === "object") {
            this._expect(TestHarness.ExpectationType.NotEmpty, !isEmptyObject(actual), message, actual);
            return;
        }

        this.fail("expectNotEmpty should not be called with a non-object:\n    Actual: " + this._expectationValueAsString(actual));
    }

    expectNull(actual, message)
    {
        this._expect(TestHarness.ExpectationType.Null, actual === null, message, actual, null);
    }

    expectNotNull(actual, message)
    {
        this._expect(TestHarness.ExpectationType.NotNull, actual !== null, message, actual);
    }

    expectEqual(actual, expected, message)
    {
        this._expect(TestHarness.ExpectationType.Equal, expected === actual, message, actual, expected);
    }

    expectNotEqual(actual, expected, message)
    {
        this._expect(TestHarness.ExpectationType.NotEqual, expected !== actual, message, actual, expected);
    }

    expectShallowEqual(actual, expected, message)
    {
        this._expect(TestHarness.ExpectationType.ShallowEqual, Object.shallowEqual(actual, expected), message, actual, expected);
    }

    expectNotShallowEqual(actual, expected, message)
    {
        this._expect(TestHarness.ExpectationType.NotShallowEqual, !Object.shallowEqual(actual, expected), message, actual, expected);
    }

    expectEqualWithAccuracy(actual, expected, accuracy, message)
    {
        console.assert(typeof expected === "number");
        console.assert(typeof actual === "number");

        this._expect(TestHarness.ExpectationType.EqualWithAccuracy, Math.abs(expected - actual) <= accuracy, message, actual, expected, accuracy);
    }

    expectLessThan(actual, expected, message)
    {
        this._expect(TestHarness.ExpectationType.LessThan, actual < expected, message, actual, expected);
    }

    expectLessThanOrEqual(actual, expected, message)
    {
        this._expect(TestHarness.ExpectationType.LessThanOrEqual, actual <= expected, message, actual, expected);
    }

    expectGreaterThan(actual, expected, message)
    {
        this._expect(TestHarness.ExpectationType.GreaterThan, actual > expected, message, actual, expected);
    }

    expectGreaterThanOrEqual(actual, expected, message)
    {
        this._expect(TestHarness.ExpectationType.GreaterThanOrEqual, actual >= expected, message, actual, expected);
    }

    pass(message)
    {
        let stringifiedMessage = TestHarness.messageAsString(message);
        this.log("PASS: " + stringifiedMessage);
    }

    fail(message)
    {
        let stringifiedMessage = TestHarness.messageAsString(message);
        this.log("FAIL: " + stringifiedMessage);
    }

    passOrFail(condition, message)
    {
        if (condition)
            this.pass(message);
        else
            this.fail(message);
    }

    // Use this to expect an exception. To further examine the exception,
    // chain onto the result with .then() and add your own test assertions.
    // The returned promise is rejected if an exception was not thrown.
    expectException(work)
    {
        if (typeof work !== "function")
            throw new Error("Invalid argument to catchException: work must be a function.");

        let expectAndDumpError = (e, resolvedValue) => {
            this.expectNotNull(e, "Should produce an exception.");
            if (!e) {
                this.expectEqual(resolvedValue, undefined, "Exception-producing work should not return a value");
                return;
            }

            if (e instanceof Error || !(e instanceof Object))
                this.log(e.toString());
            else {
                try {
                    this.json(e);
                } catch {
                    this.log(e.constructor.name);
                }
            }
        }

        let error = null;
        let result = null;
        try {
            result = work();
        } catch (caughtError) {
            error = caughtError;
        } finally {
            // If 'work' returns a promise, it will settle (resolve or reject) by itself.
            // Invert the promise's settled state to match the expectation of the caller.
            if (result instanceof Promise) {
                return result.then((resolvedValue) => {
                    expectAndDumpError(null, resolvedValue);
                    return Promise.reject(resolvedValue);
                }, (e) => { // Don't chain the .catch as it will log the value we just rejected.
                    expectAndDumpError(e);
                    return Promise.resolve(e);
                });
            }

            // If a promise is not produced, turn the exception into a resolved promise, and a
            // resolved value into a rejected value (since an exception was expected).
            expectAndDumpError(error);
            return error ? Promise.resolve(error) : Promise.reject(result);
        }
    }

    // Protected

    static messageAsString(message)
    {
        if (message instanceof Element)
            return message.textContent;

        return typeof message !== "string" ? JSON.stringify(message) : message;
    }

    static sanitizeURL(url)
    {
        if (!url)
            return "(unknown)";

        let lastPathSeparator = Math.max(url.lastIndexOf("/"), url.lastIndexOf("\\"));
        let location = lastPathSeparator > 0 ? url.substr(lastPathSeparator + 1) : url;
        if (!location.length)
            location = "(unknown)";

        // Clean up the location so it is bracketed or in parenthesis.
        if (url.indexOf("[native code]") !== -1)
            location = "[native code]";

        return location;
    }

    static sanitizeStackFrame(frame, i)
    {
        // Most frames are of the form "functionName@file:///foo/bar/File.js:345".
        // But, some frames do not have a functionName. Get rid of the file path.
        let nameAndURLSeparator = frame.indexOf("@");
        let frameName = nameAndURLSeparator > 0 ? frame.substr(0, nameAndURLSeparator) : "(anonymous)";

        let lastPathSeparator = Math.max(frame.lastIndexOf("/"), frame.lastIndexOf("\\"));
        let frameLocation = lastPathSeparator > 0 ? frame.substr(lastPathSeparator + 1) : frame;
        if (!frameLocation.length)
            frameLocation = "unknown";

        // Clean up the location so it is bracketed or in parenthesis.
        if (frame.indexOf("[native code]") !== -1)
            frameLocation = "[native code]";
        else
            frameLocation = "(" + frameLocation + ")";

        return `#${i}: ${frameName} ${frameLocation}`;
    }

    sanitizeStack(stack)
    {
        if (this.suppressStackTraces)
            return "(suppressed)";

        if (!stack || typeof stack !== "string")
            return "(unknown)";

        return stack.split("\n").map(TestHarness.sanitizeStackFrame).join("\n");
    }

    // Private

    _expect(type, condition, message, ...values)
    {
        console.assert(values.length > 0, "Should have an 'actual' value.");

        if (!message || !condition) {
            values = values.map(this._expectationValueAsString.bind(this));
            message = message || this._expectationMessageFormat(type).format(...values);
        }

        if (condition) {
            this.pass(message);
            return;
        }

        message += "\n    Expected: " + this._expectedValueFormat(type).format(...values.slice(1));
        message += "\n    Actual: " + values[0];

        this.fail(message);
    }

    _expectationValueAsString(value)
    {
        let instanceIdentifier = (object) => {
            let id = this._failureObjects.get(object);
            if (!id) {
                id = this._failureObjectIdentifier++;
                this._failureObjects.set(object, id);
            }
            return "#" + id;
        };

        const maximumValueStringLength = 200;
        const defaultValueString = String(new Object); // [object Object]

        // Special case for numbers, since JSON.stringify converts Infinity and NaN to null.
        if (typeof value === "number")
            return value;

        try {
            let valueString = JSON.stringify(value);
            if (valueString.length <= maximumValueStringLength)
                return valueString;
        } catch { }

        try {
            let valueString = String(value);
            if (valueString === defaultValueString && value.constructor && value.constructor.name !== "Object")
                return value.constructor.name + " instance " + instanceIdentifier(value);
            return valueString;
        } catch {
            return defaultValueString;
        }
    }

    _expectationMessageFormat(type)
    {
        switch (type) {
        case TestHarness.ExpectationType.True:
            return "expectThat(%s)";
        case TestHarness.ExpectationType.False:
            return "expectFalse(%s)";
        case TestHarness.ExpectationType.Empty:
            return "expectEmpty(%s)";
        case TestHarness.ExpectationType.NotEmpty:
            return "expectNotEmpty(%s)";
        case TestHarness.ExpectationType.Null:
            return "expectNull(%s)";
        case TestHarness.ExpectationType.NotNull:
            return "expectNotNull(%s)";
        case TestHarness.ExpectationType.Equal:
            return "expectEqual(%s, %s)";
        case TestHarness.ExpectationType.NotEqual:
            return "expectNotEqual(%s, %s)";
        case TestHarness.ExpectationType.ShallowEqual:
            return "expectShallowEqual(%s, %s)";
        case TestHarness.ExpectationType.NotShallowEqual:
            return "expectNotShallowEqual(%s, %s)";
        case TestHarness.ExpectationType.EqualWithAccuracy:
            return "expectEqualWithAccuracy(%s, %s, %s)";
        case TestHarness.ExpectationType.LessThan:
            return "expectLessThan(%s, %s)";
        case TestHarness.ExpectationType.LessThanOrEqual:
            return "expectLessThanOrEqual(%s, %s)";
        case TestHarness.ExpectationType.GreaterThan:
            return "expectGreaterThan(%s, %s)";
        case TestHarness.ExpectationType.GreaterThanOrEqual:
            return "expectGreaterThanOrEqual(%s, %s)";
        default:
            console.error("Unknown TestHarness.ExpectationType type: " + type);
            return null;
        }
    }

    _expectedValueFormat(type)
    {
        switch (type) {
        case TestHarness.ExpectationType.True:
            return "truthy";
        case TestHarness.ExpectationType.False:
            return "falsey";
        case TestHarness.ExpectationType.Empty:
            return "empty";
        case TestHarness.ExpectationType.NotEmpty:
            return "not empty";
        case TestHarness.ExpectationType.NotNull:
            return "not null";
        case TestHarness.ExpectationType.NotEqual:
        case TestHarness.ExpectationType.NotShallowEqual:
            return "not %s";
        case TestHarness.ExpectationType.EqualWithAccuracy:
            return "%s +/- %s";
        case TestHarness.ExpectationType.LessThan:
            return "less than %s";
        case TestHarness.ExpectationType.LessThanOrEqual:
            return "less than or equal to %s";
        case TestHarness.ExpectationType.GreaterThan:
            return "greater than %s";
        case TestHarness.ExpectationType.GreaterThanOrEqual:
            return "greater than or equal to %s";
        default:
            return "%s";
        }
    }
};

TestHarness.ExpectationType = {
    True: Symbol("expect-true"),
    False: Symbol("expect-false"),
    Empty: Symbol("expect-empty"),
    NotEmpty: Symbol("expect-not-empty"),
    Null: Symbol("expect-null"),
    NotNull: Symbol("expect-not-null"),
    Equal: Symbol("expect-equal"),
    NotEqual: Symbol("expect-not-equal"),
    ShallowEqual: Symbol("expect-shallow-equal"),
    NotShallowEqual: Symbol("expect-not-shallow-equal"),
    EqualWithAccuracy: Symbol("expect-equal-with-accuracy"),
    LessThan: Symbol("expect-less-than"),
    LessThanOrEqual: Symbol("expect-less-than-or-equal"),
    GreaterThan: Symbol("expect-greater-than"),
    GreaterThanOrEqual: Symbol("expect-greater-than-or-equal"),
};
