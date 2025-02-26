/*
 * Copyright (C) 2007, 2008, 2013 Apple Inc.  All rights reserved.
 * Copyright (C) 2009 Joseph Pecoraro
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
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
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

WI.ConsoleCommandResultMessage = class ConsoleCommandResult extends WI.ConsoleMessage
{
    constructor(target, result, wasThrown, savedResultIndex, { shouldRevealConsole } ={})
    {
        let source = WI.ConsoleMessage.MessageSource.JS;
        let level = wasThrown ? WI.ConsoleMessage.MessageLevel.Error : WI.ConsoleMessage.MessageLevel.Log;
        let type = WI.ConsoleMessage.MessageType.Result;

        super(target, source, level, "", type, undefined, undefined, undefined, 0, [result], undefined, undefined);

        this._savedResultIndex = savedResultIndex;
        this._shouldRevealConsole = !!shouldRevealConsole;

        if (this._savedResultIndex && this._savedResultIndex > WI.ConsoleCommandResultMessage.maximumSavedResultIndex)
            WI.ConsoleCommandResultMessage.maximumSavedResultIndex = this._savedResultIndex;
    }

    // Static

    static clearMaximumSavedResultIndex()
    {
        WI.ConsoleCommandResultMessage.maximumSavedResultIndex = 0;
    }

    // Public

    get savedResultIndex()
    {
        return this._savedResultIndex;
    }

    get shouldRevealConsole()
    {
        return this._shouldRevealConsole;
    }
};

WI.ConsoleCommandResultMessage.maximumSavedResultIndex = 0;
