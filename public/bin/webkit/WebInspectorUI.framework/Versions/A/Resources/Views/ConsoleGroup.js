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

WI.ConsoleGroup = class ConsoleGroup extends WI.Object
{
    constructor(parentGroup)
    {
        super();

        this._parentGroup = parentGroup;
        this._element = null;
    }

    // Public

    get element() { return this._element; }
    
    get parentGroup()
    {
        return this._parentGroup;
    }

    render(messageView)
    {
        var groupElement = document.createElement("div");
        groupElement.className = "console-group";
        this._element = groupElement;

        var titleElement = messageView.element;
        titleElement.classList.add(WI.LogContentView.ItemWrapperStyleClassName);
        titleElement.addEventListener("click", this._titleClicked.bind(this));
        titleElement.addEventListener("mousedown", this._titleMouseDown.bind(this));

        if (groupElement && messageView.message.type === WI.ConsoleMessage.MessageType.StartGroupCollapsed)
            groupElement.classList.add("collapsed");

        groupElement.appendChild(titleElement);

        var messagesElement = document.createElement("div");
        this._messagesElement = messagesElement;
        messagesElement.className = "console-group-messages";
        groupElement.appendChild(messagesElement);

        return groupElement;
    }

    addMessageView(messageView)
    {
        var element = messageView.element;
        element.classList.add(WI.LogContentView.ItemWrapperStyleClassName);
        this.append(element);
    }

    append(messageOrGroupElement)
    {
        this._messagesElement.appendChild(messageOrGroupElement);
    }
    
    // FIXME: <https://webkit.org/b/264489> We should merge this logic with `WI.ConsoleMessageView.prototype.render`
    setMessageLevel(messageLevel)
    {
        console.assert(this._element);
  
        switch (messageLevel) {
        case WI.ConsoleMessage.MessageLevel.Log:
            this._element.classList.add("console-log-level");
            this._element.setAttribute("data-labelprefix", WI.UIString("Log: "));
            break;
        case WI.ConsoleMessage.MessageLevel.Info:
            this._element.classList.add("console-info-level");
            this._element.setAttribute("data-labelprefix", WI.UIString("Info: "));
            break;
        case WI.ConsoleMessage.MessageLevel.Debug:
            this._element.classList.add("console-debug-level");
            this._element.setAttribute("data-labelprefix", WI.UIString("Debug: "));
            break;
        case WI.ConsoleMessage.MessageLevel.Warning:
            this._element.classList.add("console-warning-level");
            this._element.setAttribute("data-labelprefix", WI.UIString("Warning: "));
            break;
        case WI.ConsoleMessage.MessageLevel.Error:
            this._element.classList.add("console-error-level");
            this._element.setAttribute("data-labelprefix", WI.UIString("Error: "));
            break;
        }
    }

    // Private

    _titleMouseDown(event)
    {
        event.preventDefault();
    }

    _titleClicked(event)
    {
        var groupTitleElement = event.target.closest(".console-group-title");
        if (groupTitleElement) {
            var groupElement = groupTitleElement.closest(".console-group");
            if (groupElement)
                groupElement.classList.toggle("collapsed");
            groupTitleElement.scrollIntoViewIfNeeded(true);
        }
    }
};
