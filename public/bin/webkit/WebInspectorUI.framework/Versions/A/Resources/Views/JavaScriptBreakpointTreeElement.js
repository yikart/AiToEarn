/*
 * Copyright (C) 2013-2015 Apple Inc. All rights reserved.
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

WI.JavaScriptBreakpointTreeElement = class JavaScriptBreakpointTreeElement extends WI.BreakpointTreeElement
{
    constructor(breakpoint, {classNames, title} = {})
    {
        console.assert(breakpoint instanceof WI.JavaScriptBreakpoint);

        if (!Array.isArray(classNames))
            classNames = ["line"];
        classNames.push("javascript");

        if (!title && breakpoint.special)
            title = breakpoint.displayName;

        super(breakpoint, {classNames, title});
    }

    // Public

    get filterableData()
    {
        return {text: [this.breakpoint.contentIdentifier]};
    }

    onattach()
    {
        super.onattach();

        if (!this.breakpoint.special) {
            this.breakpoint.addEventListener(WI.JavaScriptBreakpoint.Event.LocationDidChange, this._breakpointLocationDidChange, this);
            this._updateTitles();
        }
        this.breakpoint.addEventListener(WI.JavaScriptBreakpoint.Event.ResolvedStateDidChange, this.updateStatus, this);
    }

    ondetach()
    {
        if (!this.breakpoint.special)
            this.breakpoint.removeEventListener(WI.JavaScriptBreakpoint.Event.LocationDidChange, this._breakpointLocationDidChange, this);
        this.breakpoint.removeEventListener(WI.JavaScriptBreakpoint.Event.ResolvedStateDidChange, this.updateStatus, this);

        super.ondetach();
    }

    // Private

    _updateTitles()
    {
        console.assert(!this.breakpoint.special);

        let sourceCodeLocation = this.breakpoint.sourceCodeLocation;

        let displayLineNumber = sourceCodeLocation.displayLineNumber;
        let displayColumnNumber = sourceCodeLocation.displayColumnNumber;
        if (displayColumnNumber > 0)
            this.mainTitle = WI.UIString("Line %d:%d").format(displayLineNumber + 1, displayColumnNumber + 1); // The user visible line and column numbers are 1-based.
        else
            this.mainTitle = WI.UIString("Line %d").format(displayLineNumber + 1); // The user visible line number is 1-based.

        if (sourceCodeLocation.hasMappedLocation()) {
            this.subtitle = sourceCodeLocation.formattedLocationString();

            if (sourceCodeLocation.hasFormattedLocation())
                this.subtitleElement.classList.add("formatted-location");
            else
                this.subtitleElement.classList.remove("formatted-location");

            this.tooltip = this.mainTitle + " \u2014 " + WI.UIString("originally %s").format(sourceCodeLocation.originalLocationString());
        }
    }

    _breakpointLocationDidChange(event)
    {
        console.assert(event.target === this.breakpoint);

        // The Breakpoint has a new display SourceCode. The sidebar will remove us, and ondetach() will clear listeners.
        if (event.data.oldDisplaySourceCode === this.breakpoint.displaySourceCode)
            return;

        this._updateTitles();
    }
};
