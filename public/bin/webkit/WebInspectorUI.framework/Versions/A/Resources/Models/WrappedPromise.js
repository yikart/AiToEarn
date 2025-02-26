/*
 * Copyright (C) 2015, 2016 Apple Inc. All rights reserved.
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

WI.WrappedPromise = class WrappedPromise
{
    constructor(work)
    {
        this._settled = false;
        this._promise = new Promise((resolve, reject) => {
            this._resolveCallback = resolve;
            this._rejectCallback = reject;

            // Allow work to resolve or reject the promise by shimming our
            // internal callbacks. This ensures that this._settled gets set properly.
            if (work && typeof work === "function")
                return work(this.resolve.bind(this), this.reject.bind(this));
        });
    }

    // Public

    get settled()
    {
        return this._settled;
    }

    get promise()
    {
        return this._promise;
    }

    resolve(value)
    {
        if (this._settled)
            throw new Error("Promise is already settled, cannot call resolve().");

        this._settled = true;
        this._resolveCallback(value);
    }

    reject(value)
    {
        if (this._settled)
            throw new Error("Promise is already settled, cannot call reject().");

        this._settled = true;
        this._rejectCallback(value);
    }
};
