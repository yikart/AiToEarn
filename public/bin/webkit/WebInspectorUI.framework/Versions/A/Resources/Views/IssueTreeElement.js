/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

WI.IssueTreeElement = class IssueTreeElement extends WI.GeneralTreeElement
{
    constructor(issueMessage)
    {
        var levelStyleClassName;
        switch (issueMessage.level) {
        case "error":
            levelStyleClassName = WI.IssueTreeElement.ErrorStyleClassName;
            break;
        case "warning":
            levelStyleClassName = WI.IssueTreeElement.WarningStyleClassName;
            break;
        }

        const title = null;
        const subtitle = null;
        super([WI.IssueTreeElement.StyleClassName, levelStyleClassName], title, subtitle, issueMessage);

        this._issueMessage = issueMessage;
        this._updateTitles();

        this._issueMessage.addEventListener(WI.IssueMessage.Event.DisplayLocationDidChange, this._updateTitles, this);
    }

    // Public

    get issueMessage()
    {
        return this._issueMessage;
    }

    // Private

    _updateTitles()
    {
        if (this._issueMessage.sourceCodeLocation) {
            let displayLineNumber = this._issueMessage.sourceCodeLocation.displayLineNumber;
            let displayColumnNumber = this._issueMessage.sourceCodeLocation.displayColumnNumber;
            var lineNumberLabel;
            if (displayColumnNumber > 0)
                lineNumberLabel = WI.UIString("Line %d:%d").format(displayLineNumber + 1, displayColumnNumber + 1); // The user visible line and column numbers are 1-based.
            else
                lineNumberLabel = WI.UIString("Line %d").format(displayLineNumber + 1); // The user visible line number is 1-based.

            this.mainTitle = `${lineNumberLabel} ${this._issueMessage.text}`;
        } else
            this.mainTitle = this._issueMessage.text;
    }
};

WI.IssueTreeElement.StyleClassName = "issue";
WI.IssueTreeElement.ErrorStyleClassName = "error";
WI.IssueTreeElement.WarningStyleClassName = "warning";
