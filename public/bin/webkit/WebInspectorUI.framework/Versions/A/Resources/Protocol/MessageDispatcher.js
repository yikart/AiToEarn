/*
 * Copyright (C) 2013, 2015 Apple Inc. All rights reserved.
 * Copyright (C) 2014 University of Washington
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

WI._messagesToDispatch = [];

WI.dispatchNextQueuedMessageFromBackend = function()
{
    const startCount = WI._messagesToDispatch.length;
    const startTimestamp = performance.now();
    const timeLimitPerRunLoop = 10; // milliseconds

    let i = 0;
    for (; i < WI._messagesToDispatch.length; ++i) {
        // Defer remaining messages if we have taken too long. In practice, single
        // messages like Page.getResourceContent blow through the time budget.
        if (performance.now() - startTimestamp > timeLimitPerRunLoop)
            break;

        InspectorBackend.dispatch(WI._messagesToDispatch[i]);
    }

    if (i === WI._messagesToDispatch.length) {
        WI._messagesToDispatch = [];
        WI._dispatchTimeout = null;
    } else {
        WI._messagesToDispatch = WI._messagesToDispatch.slice(i);
        WI._dispatchTimeout = setTimeout(WI.dispatchNextQueuedMessageFromBackend, 0);
    }

    if (InspectorBackend.dumpInspectorTimeStats) {
        let messageDuration = (performance.now() - startTimestamp).toFixed(3);
        let dispatchedCount = startCount - WI._messagesToDispatch.length;
        let remainingCount = WI._messagesToDispatch.length;
        console.log(`time-stats: --- RunLoop duration: ${messageDuration}ms; dispatched: ${dispatchedCount}; remaining: ${remainingCount}`);
    }
};

WI.dispatchMessageFromBackend = function(message)
{
    // Enforce asynchronous interaction between the backend and the frontend by queueing messages.
    // The messages are dequeued on a zero delay timeout.

    this._messagesToDispatch.push(message);

    // If something has gone wrong and the uncaught exception sheet is showing,
    // then don't try to dispatch more messages. Dispatching causes spurious uncaught
    // exceptions and cause the sheet to overflow with hundreds of logged exceptions.
    if (window.__uncaughtExceptions && window.__uncaughtExceptions.length)
        return;

    if (this._dispatchTimeout)
        return;

    this._dispatchTimeout = setTimeout(this.dispatchNextQueuedMessageFromBackend, 0);
};
