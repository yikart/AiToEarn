/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

// Debouncer wraps a function and continues to delay its invocation as long as
// clients continue to delay its firing. The most recent delay call overrides
// previous calls. Delays may be timeouts, animation frames, or microtasks.
//
// Example:
//
//     let debouncer = new Debouncer(() => { this.refresh() });
//     element.addEventListener("keydown", (event) => { debouncer.delayForTime(100); });
//
// Will ensure `refresh` will not happen until no keyevent has happened in 100ms:
//
//               0ms          100ms         200ms         300ms         400ms
//     time:      |-------------|-------------|-------------|-------------|
//     delay:     ^     ^ ^        ^      ^        ^    ^   ^
//     refreshes:                                                         * (1)
//
// When the wrapped function is actually called, it will be given the most recent set of arguments.

class Debouncer
{
    constructor(callback)
    {
        console.assert(typeof callback === "function");

        this._callback = callback;
        this._lastArguments = [];

        this._timeoutIdentifier = undefined;
        this._animationFrameIdentifier = undefined;
        this._promiseIdentifier = undefined;
    }

    // Public

    force()
    {
        this._lastArguments = arguments;
        this._execute();
    }

    delayForTime(time, ...args)
    {
        console.assert(time >= 0);

        this.cancel();

        this._lastArguments = args;

        this._timeoutIdentifier = setTimeout(() => {
            this._execute();
        }, time);
    }

    delayForFrame()
    {
        this.cancel();

        this._lastArguments = arguments;

        this._animationFrameIdentifier = requestAnimationFrame(() => {
            this._execute();
        });
    }

    delayForMicrotask()
    {
        this.cancel();

        this._lastArguments = arguments;

        let promiseIdentifier = Symbol("next-microtask");

        this._promiseIdentifier = promiseIdentifier;

        queueMicrotask(() => {
            if (this._promiseIdentifier === promiseIdentifier)
                this._execute();
        });
    }

    cancel()
    {
        this._lastArguments = [];

        if (this._timeoutIdentifier) {
            clearTimeout(this._timeoutIdentifier);
            this._timeoutIdentifier = undefined;
        }

        if (this._animationFrameIdentifier) {
            cancelAnimationFrame(this._animationFrameIdentifier);
            this._animationFrameIdentifier = undefined;
        }

        if (this._promiseIdentifier)
            this._promiseIdentifier = undefined;
    }

    // Private

    _execute()
    {
        let args = this._lastArguments;

        this.cancel();

        this._callback.apply(undefined, args);
    }
}
