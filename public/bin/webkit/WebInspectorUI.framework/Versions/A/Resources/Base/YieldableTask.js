/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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

WI.YieldableTask = class YieldableTask
{
    constructor(delegate, items, options = {})
    {
        let {workInterval, idleInterval} = options;
        console.assert(!workInterval || workInterval > 0, workInterval);
        console.assert(!idleInterval || idleInterval > 0, idleInterval);

        console.assert(delegate && typeof delegate.yieldableTaskWillProcessItem === "function", "Delegate provide an implementation of method 'yieldableTaskWillProcessItem'.");

        console.assert(items instanceof Object && Symbol.iterator in items, "Argument `items` must subclass Object and be iterable.", items);

        // Milliseconds to run before the task should yield.
        this._workInterval = workInterval || 10;
        // Milliseconds to idle before asynchronously resuming the task.
        this._idleInterval = idleInterval || 0;

        this._delegate = delegate;

        this._items = items;
        this._idleTimeoutIdentifier = undefined;
        this._processing = false;
        this._processing = false;
        this._cancelled = false;
    }

    // Public

    get processing() { return this._processing; }
    get cancelled() { return this._cancelled; }

    get idleInterval() { return this._idleInterval; }
    get workInterval() { return this._workInterval; }

    start()
    {
        console.assert(!this._processing);
        if (this._processing)
            return;

        console.assert(!this._cancelled);
        if (this._cancelled)
            return;

        function* createIteratorForProcessingItems()
        {
            let startTime = Date.now();
            let processedItems = [];

            for (let item of this._items) {
                if (this._cancelled)
                    break;

                this._delegate.yieldableTaskWillProcessItem(this, item);
                processedItems.push(item);

                // Calling out to the delegate may cause the task to be cancelled.
                if (this._cancelled)
                    break;

                let elapsedTime = Date.now() - startTime;
                if (elapsedTime > this._workInterval) {
                    let returnedItems = processedItems.slice();
                    processedItems = [];
                    this._willYield(returnedItems, elapsedTime);

                    yield;

                    startTime = Date.now();
                }
            }

            // The task sends a fake yield notification to the delegate so that
            // the delegate receives notification of all processed items before finishing.
            if (processedItems.length)
                this._willYield(processedItems, Date.now() - startTime);
        }

        this._processing = true;
        this._pendingItemsIterator = createIteratorForProcessingItems.call(this);
        this._processPendingItems();
    }

    cancel()
    {
        if (!this._processing)
            return;

        this._cancelled = true;
    }

    // Private

    _processPendingItems()
    {
        console.assert(this._processing);

        if (this._cancelled)
            return;

        if (!this._pendingItemsIterator.next().done) {
            this._idleTimeoutIdentifier = setTimeout(() => { this._processPendingItems(); }, this._idleInterval);
            return;
        }

        this._didFinish();
    }

    _willYield(processedItems, elapsedTime)
    {
        if (typeof this._delegate.yieldableTaskDidYield === "function")
            this._delegate.yieldableTaskDidYield(this, processedItems, elapsedTime);
    }

    _didFinish()
    {
        this._processing = false;
        this._pendingItemsIterator = null;

        if (this._idleTimeoutIdentifier) {
            clearTimeout(this._idleTimeoutIdentifier);
            this._idleTimeoutIdentifier = undefined;
        }

        if (typeof this._delegate.yieldableTaskDidFinish === "function")
            this._delegate.yieldableTaskDidFinish(this);
    }
};

