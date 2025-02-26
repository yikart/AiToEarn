/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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

WI.ExecutionContextList = class ExecutionContextList
{
    constructor()
    {
        this._contexts = [];
        this._pageExecutionContext = null;
    }

    // Public

    get pageExecutionContext()
    {
        return this._pageExecutionContext;
    }

    get contexts()
    {
        return this._contexts;
    }

    add(context)
    {
        // COMPATIBILITY (iOS 13.0): Older iOS releases will send duplicates.
        // Newer releases will not and this check should be removed eventually.
        if (context.type === WI.ExecutionContext.Type.Normal && this._pageExecutionContext) {
            console.assert(context.id === this._pageExecutionContext.id);
            return;
        }

        this._contexts.push(context);

        if (context.type === WI.ExecutionContext.Type.Normal && context.target.type === WI.TargetType.Page) {
            console.assert(!this._pageExecutionContext);
            this._pageExecutionContext = context;
        }
    }

    clear()
    {
        this._contexts = [];
        this._pageExecutionContext = null;
    }
};
