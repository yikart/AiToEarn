/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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

WI.ConsoleSnippetTreeElement = class ConsoleSnippetTreeElement extends WI.ScriptTreeElement
{
    constructor(consoleSnippet)
    {
        console.assert(consoleSnippet instanceof WI.ConsoleSnippet, consoleSnippet);

        super(consoleSnippet);

        this.addClassName("console-snippet");
    }

    // Protected

    onattach()
    {
        super.onattach();

        this.status = document.createElement("img");
        this.status.title = WI.UIString("Run");
        this.status.addEventListener("click", (event) => {
            this.representedObject.run();
        });
    }

    ondelete()
    {
        WI.consoleManager.removeSnippet(this.representedObject);

        return true;
    }

    onenter()
    {
        this.representedObject.run();

        return true;
    }

    onspace()
    {
        this.representedObject.run();

        return true;
    }

    canSelectOnMouseDown(event)
    {
        if (this.status.contains(event.target))
            return false;

        return super.canSelectOnMouseDown(event);
    }

    populateContextMenu(contextMenu, event)
    {
        contextMenu.appendSeparator();

        contextMenu.appendItem(WI.UIString("Run Console Snippet"), () => {
            this.representedObject.run();
        });

        contextMenu.appendSeparator();

        super.populateContextMenu(contextMenu, event);
    }

    updateStatus()
    {
        // Do nothing. Do not allow ScriptTreeElement / SourceCodeTreeElement to modify our status element.
    }
};
