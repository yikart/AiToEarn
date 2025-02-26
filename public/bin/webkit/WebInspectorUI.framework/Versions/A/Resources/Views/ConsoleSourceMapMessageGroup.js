/*
 * Copyright (C) 2023 Apple Inc.  All rights reserved.
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

WI.ConsoleSourceMapMessageGroup = class ConsoleSourceMapMessageGroup extends WI.ConsoleGroup
{
    constructor()
    {
        super();

        this._messageCount = 0;
        
        // Create a WI.ConsoleMessage as an error message to use as a title for the group
        let titleConsoleMessage = new WI.ConsoleMessage(WI.mainTarget, WI.ConsoleMessage.MessageSource.Other, WI.ConsoleMessage.MessageLevel.Error, WI.UIString("Source Map loading errors"), WI.ConsoleMessage.MessageType.StartGroupCollapsed);

        this._titleConsoleMessageView = new WI.ConsoleMessageView(titleConsoleMessage);
        this._titleConsoleMessageView.render();

        this.render(this._titleConsoleMessageView);
        this.setMessageLevel(WI.ConsoleMessage.MessageLevel.Error);
    }

    // Public

    addMessageView(messageView)
    {
        super.addMessageView(messageView);

        this._messageCount++;
        this._titleConsoleMessageView.repeatCount = this._messageCount;
    }
};
