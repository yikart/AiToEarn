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

// Throttler wraps a function and ensures it doesn't get called more than once every `delay` ms.
// The first fire will always trigger synchronous, and subsequent calls that need to be throttled
// will happen later asynchronously.
//
// Example:
//
//     let throttler = new Throttler(250, () => { this.refresh() });
//     element.addEventListener("keydown", (event) => { throttler.fire(); });
//
// Will ensure `refresh` happens no more than once every 250ms no matter how often `fire` is called:
//
//               0ms                        250ms                       500ms
//     time:      |---------------------------|---------------------------|
//     fire:      ^     ^ ^        ^      ^        ^    ^   ^
//     refreshes: * (1)                       * (2)                       * (3)
//
// When the wrapped function is actually called, it will be given the most recent set of arguments.

class Throttler
{
    constructor(callback, delay)
    {
        console.assert(typeof callback === "function");
        console.assert(delay >= 0);

        this._callback = callback;
        this._delay = delay;

        this._lastArguments = [];

        this._timeoutIdentifier = undefined;
        this._lastFireTime = -this._delay;
    }

    // Public

    force()
    {
        this._lastArguments = arguments;
        this._execute();
    }

    fire()
    {
        this._lastArguments = arguments;

        let remaining = this._delay - (Date.now() - this._lastFireTime);
        if (remaining <= 0) {
            this._execute();
            return;
        }

        if (this._timeoutIdentifier)
            return;

        this._timeoutIdentifier = setTimeout(() => {
            this._execute();
        }, remaining);
    }

    cancel()
    {
        this._lastArguments = [];

        if (this._timeoutIdentifier) {
            clearTimeout(this._timeoutIdentifier);
            this._timeoutIdentifier = undefined;
        }
    }

    // Private

    _execute()
    {
        this._lastFireTime = Date.now();

        let args = this._lastArguments;

        this.cancel();

        this._callback.apply(undefined, args);
    }
}
