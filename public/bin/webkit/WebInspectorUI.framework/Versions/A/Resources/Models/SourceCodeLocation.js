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

WI.SourceCodeLocation = class SourceCodeLocation extends WI.Object
{
    constructor(sourceCode, lineNumber, columnNumber)
    {
        super();

        console.assert(sourceCode === null || sourceCode instanceof WI.SourceCode);
        console.assert(!(sourceCode instanceof WI.SourceMapResource));
        console.assert(typeof lineNumber === "number" && !isNaN(lineNumber) && lineNumber >= 0);
        console.assert(typeof columnNumber === "number" && !isNaN(columnNumber) && columnNumber >= 0);

        this._sourceCode = sourceCode || null;
        this._lineNumber = lineNumber;
        this._columnNumber = columnNumber;
        this._resolveFormattedLocation();

        if (this._sourceCode) {
            this._sourceCode.addEventListener(WI.SourceCode.Event.SourceMapAdded, this._sourceCodeSourceMapAdded, this);
            this._sourceCode.addEventListener(WI.SourceCode.Event.FormatterDidChange, this._sourceCodeFormatterDidChange, this);
        }

        this._resetMappedLocation();
    }

    // Static

    static get specialBreakpointLocation()
    {
        return new WI.SourceCodeLocation(null, Infinity, Infinity);
    }

    // Public

    isEqual(other)
    {
        if (!other)
            return false;

        if (this.lineNumber !== other.lineNumber)
            return false;

        if (this.columnNumber !== other.columnNumber)
            return false;

        function resolveSourceCode(sourceCode) {
            if (sourceCode instanceof WI.Script)
                return sourceCode.resource;
            return sourceCode;
        }
        let thisSourceCode = resolveSourceCode(this.sourceCode);
        let otherSourceCode = resolveSourceCode(other.sourceCode);
        if (thisSourceCode !== otherSourceCode)
            return false;

        return true;
    }

    get sourceCode()
    {
        return this._sourceCode;
    }

    set sourceCode(sourceCode)
    {
        this.setSourceCode(sourceCode);
    }

    // Raw line and column in the original source code.

    get lineNumber()
    {
        return this._lineNumber;
    }

    get columnNumber()
    {
        return this._columnNumber;
    }

    position()
    {
        return new WI.SourceCodePosition(this.lineNumber, this.columnNumber);
    }

    // Formatted line and column if the original source code is pretty printed.
    // This is the same as the raw location if there is no formatter.

    get formattedLineNumber()
    {
        return this._formattedLineNumber;
    }

    get formattedColumnNumber()
    {
        return this._formattedColumnNumber;
    }

    formattedPosition()
    {
        return new WI.SourceCodePosition(this.formattedLineNumber, this.formattedColumnNumber);
    }

    // Display line and column:
    //   - Mapped line and column if the original source code has a source map.
    //   - Otherwise this is the formatted / raw line and column.

    get displaySourceCode()
    {
        this.resolveMappedLocation();
        return this._mappedResource || this._sourceCode;
    }

    get displayLineNumber()
    {
        this.resolveMappedLocation();
        return isNaN(this._mappedLineNumber) ? this._formattedLineNumber : this._mappedLineNumber;
    }

    get displayColumnNumber()
    {
        this.resolveMappedLocation();
        return isNaN(this._mappedColumnNumber) ? this._formattedColumnNumber : this._mappedColumnNumber;
    }

    displayPosition()
    {
        return new WI.SourceCodePosition(this.displayLineNumber, this.displayColumnNumber);
    }

    // User presentable location strings: "file:lineNumber:columnNumber".

    originalLocationString(columnStyle, nameStyle, prefix)
    {
        return this._locationString(this.sourceCode, this.lineNumber, this.columnNumber, columnStyle, nameStyle, prefix);
    }

    formattedLocationString(columnStyle, nameStyle, prefix)
    {
        return this._locationString(this.sourceCode, this.formattedLineNumber, this.formattedColumn, columnStyle, nameStyle, prefix);
    }

    displayLocationString(columnStyle, nameStyle, prefix)
    {
        return this._locationString(this.displaySourceCode, this.displayLineNumber, this.displayColumnNumber, columnStyle, nameStyle, prefix);
    }

    tooltipString()
    {
        if (!this.hasDifferentDisplayLocation())
            return this.originalLocationString(WI.SourceCodeLocation.ColumnStyle.Shown, WI.SourceCodeLocation.NameStyle.Full);

        var tooltip = WI.UIString("Located at %s").format(this.displayLocationString(WI.SourceCodeLocation.ColumnStyle.Shown, WI.SourceCodeLocation.NameStyle.Full));
        tooltip += "\n" + WI.UIString("Originally %s").format(this.originalLocationString(WI.SourceCodeLocation.ColumnStyle.Shown, WI.SourceCodeLocation.NameStyle.Full));
        return tooltip;
    }

    hasMappedLocation()
    {
        this.resolveMappedLocation();
        return this._mappedResource !== null;
    }

    hasFormattedLocation()
    {
        return this._formattedLineNumber !== this._lineNumber || this._formattedColumnNumber !== this._columnNumber;
    }

    hasDifferentDisplayLocation()
    {
       return this.hasMappedLocation() || this.hasFormattedLocation();
    }

    update(sourceCode, lineNumber, columnNumber)
    {
        console.assert(sourceCode === this._sourceCode || (this._mappedResource && sourceCode === this._mappedResource));
        console.assert(typeof lineNumber === "number" && !isNaN(lineNumber) && lineNumber >= 0);
        console.assert(typeof columnNumber === "number" && !isNaN(columnNumber) && columnNumber >= 0);

        if (sourceCode === this._sourceCode && lineNumber === this._lineNumber && columnNumber === this._columnNumber)
            return;
        if (this._mappedResource && sourceCode === this._mappedResource && lineNumber === this._mappedLineNumber && columnNumber === this._mappedColumnNumber)
            return;

        var newSourceCodeLocation = sourceCode.createSourceCodeLocation(lineNumber, columnNumber);
        console.assert(newSourceCodeLocation.sourceCode === this._sourceCode);

        this._makeChangeAndDispatchChangeEventIfNeeded(function() {
            this._lineNumber = newSourceCodeLocation._lineNumber;
            this._columnNumber = newSourceCodeLocation._columnNumber;
            if (newSourceCodeLocation._mappedLocationIsResolved) {
                this._mappedLocationIsResolved = true;
                this._mappedResource = newSourceCodeLocation._mappedResource;
                this._mappedLineNumber = newSourceCodeLocation._mappedLineNumber;
                this._mappedColumnNumber = newSourceCodeLocation._mappedColumnNumber;
            }
        });
    }

    populateLiveDisplayLocationTooltip(element, prefix, suffix)
    {
        prefix = prefix || "";
        suffix = suffix || "";

        element.title = prefix + this.tooltipString() + suffix;

        this.addEventListener(WI.SourceCodeLocation.Event.DisplayLocationChanged, function(event) {
            if (this.sourceCode)
                element.title = prefix + this.tooltipString() + suffix;
        }, this);
    }

    populateLiveDisplayLocationString(element, propertyName, columnStyle, nameStyle, prefix)
    {
        var currentDisplay;

        function updateDisplayString(showAlternativeLocation, forceUpdate)
        {
            if (!forceUpdate && currentDisplay === showAlternativeLocation)
                return;

            currentDisplay = showAlternativeLocation;

            if (!showAlternativeLocation) {
                element[propertyName] = this.displayLocationString(columnStyle, nameStyle, prefix);
                element.classList.toggle(WI.SourceCodeLocation.DisplayLocationClassName, this.hasDifferentDisplayLocation());
            } else if (this.hasDifferentDisplayLocation()) {
                element[propertyName] = this.originalLocationString(columnStyle, nameStyle, prefix);
                element.classList.remove(WI.SourceCodeLocation.DisplayLocationClassName);
            }
        }

        function mouseOverOrMove(event)
        {
            updateDisplayString.call(this, event.metaKey && !event.altKey && !event.shiftKey);
        }

        updateDisplayString.call(this, false);

        this.addEventListener(WI.SourceCodeLocation.Event.DisplayLocationChanged, function(event) {
            if (this.sourceCode)
                updateDisplayString.call(this, currentDisplay, true);
        }, this);

        var boundMouseOverOrMove = mouseOverOrMove.bind(this);
        element.addEventListener("mouseover", boundMouseOverOrMove);
        element.addEventListener("mousemove", boundMouseOverOrMove);
        element.addEventListener("mouseout", (event) => { updateDisplayString.call(this, false); });
    }

    // Protected

    setSourceCode(sourceCode)
    {
        if (sourceCode === this._sourceCode)
            return;

        console.assert((this._sourceCode === null && sourceCode instanceof WI.SourceCode) || (this._sourceCode instanceof WI.SourceCode && sourceCode === null) || this._sourceCode?.contentIdentifier === sourceCode?.contentIdentifier);

        this._makeChangeAndDispatchChangeEventIfNeeded(function() {
            if (this._sourceCode) {
                this._sourceCode.removeEventListener(WI.SourceCode.Event.SourceMapAdded, this._sourceCodeSourceMapAdded, this);
                this._sourceCode.removeEventListener(WI.SourceCode.Event.FormatterDidChange, this._sourceCodeFormatterDidChange, this);
            }

            this._sourceCode = sourceCode;

            if (this._sourceCode) {
                this._sourceCode.addEventListener(WI.SourceCode.Event.SourceMapAdded, this._sourceCodeSourceMapAdded, this);
                this._sourceCode.addEventListener(WI.SourceCode.Event.FormatterDidChange, this._sourceCodeFormatterDidChange, this);
            }
        });
    }

    resolveMappedLocation()
    {
        if (this._mappedLocationIsResolved)
            return;

        console.assert(this._mappedResource === null);
        console.assert(isNaN(this._mappedLineNumber));
        console.assert(isNaN(this._mappedColumnNumber));

        this._mappedLocationIsResolved = true;

        if (!this._sourceCode)
            return;

        var sourceMaps = this._sourceCode.sourceMaps;
        if (!sourceMaps.length)
            return;

        for (var i = 0; i < sourceMaps.length; ++i) {
            var sourceMap = sourceMaps[i];
            var entry = sourceMap.findEntry(this._lineNumber, this._columnNumber);
            if (!entry || entry.length === 2)
                continue;
            console.assert(entry.length === 5);
            var url = entry[2];
            var sourceMapResource = sourceMap.resourceForURL(url);
            if (!sourceMapResource)
                return;
            this._mappedResource = sourceMapResource;
            this._mappedLineNumber = entry[3];
            this._mappedColumnNumber = entry[4];
            return;
        }
    }

    // Private

    _locationString(sourceCode, lineNumber, columnNumber, columnStyle, nameStyle, prefix)
    {
        console.assert(sourceCode);
        if (!sourceCode)
            return "";

        columnStyle = columnStyle || WI.SourceCodeLocation.ColumnStyle.OnlyIfLarge;
        nameStyle = nameStyle || WI.SourceCodeLocation.NameStyle.Short;
        prefix = prefix || "";

        let lineString = lineNumber + 1; // The user visible line number is 1-based.
        if (columnStyle === WI.SourceCodeLocation.ColumnStyle.Shown && columnNumber > 0)
            lineString += ":" + (columnNumber + 1); // The user visible column number is 1-based.
        else if (columnStyle === WI.SourceCodeLocation.ColumnStyle.OnlyIfLarge && columnNumber > WI.SourceCodeLocation.LargeColumnNumber)
            lineString += ":" + (columnNumber + 1); // The user visible column number is 1-based.
        else if (columnStyle === WI.SourceCodeLocation.ColumnStyle.Hidden)
            lineString = "";

        switch (nameStyle) {
        case WI.SourceCodeLocation.NameStyle.None:
            return prefix + lineString;

        case WI.SourceCodeLocation.NameStyle.Short:
        case WI.SourceCodeLocation.NameStyle.Full:
            var displayURL = sourceCode.displayURL;
            var name = nameStyle === WI.SourceCodeLocation.NameStyle.Full && displayURL ? displayURL : sourceCode.displayName;
            if (columnStyle === WI.SourceCodeLocation.ColumnStyle.Hidden)
                return prefix + name;
            var lineSuffix = displayURL ? ":" + lineString : WI.UIString(" (line %s)").format(lineString);
            return prefix + name + lineSuffix;

        default:
            console.error("Unknown nameStyle: " + nameStyle);
            return prefix + lineString;
        }
    }

    _resetMappedLocation()
    {
        this._mappedLocationIsResolved = false;
        this._mappedResource = null;
        this._mappedLineNumber = NaN;
        this._mappedColumnNumber = NaN;
    }

    _setMappedLocation(mappedResource, mappedLineNumber, mappedColumnNumber)
    {
        // Called by SourceMapResource when it creates a SourceCodeLocation and already knows the resolved location.
        this._mappedLocationIsResolved = true;
        this._mappedResource = mappedResource;
        this._mappedLineNumber = mappedLineNumber;
        this._mappedColumnNumber = mappedColumnNumber;
    }

    _resolveFormattedLocation()
    {
        if (this._sourceCode && this._sourceCode.formatterSourceMap) {
            var formattedLocation = this._sourceCode.formatterSourceMap.originalToFormatted(this._lineNumber, this._columnNumber);
            this._formattedLineNumber = formattedLocation.lineNumber;
            this._formattedColumnNumber = formattedLocation.columnNumber;
        } else {
            this._formattedLineNumber = this._lineNumber;
            this._formattedColumnNumber = this._columnNumber;
        }
    }

    _makeChangeAndDispatchChangeEventIfNeeded(changeFunction)
    {
        var oldSourceCode = this._sourceCode;
        var oldLineNumber = this._lineNumber;
        var oldColumnNumber = this._columnNumber;

        var oldFormattedLineNumber = this._formattedLineNumber;
        var oldFormattedColumnNumber = this._formattedColumnNumber;

        var oldDisplaySourceCode = this.displaySourceCode;
        var oldDisplayLineNumber = this.displayLineNumber;
        var oldDisplayColumnNumber = this.displayColumnNumber;

        this._resetMappedLocation();

        if (changeFunction)
            changeFunction.call(this);

        this.resolveMappedLocation();
        this._resolveFormattedLocation();

        // If the display source code is non-null then the addresses are not NaN and can be compared.
        var displayLocationChanged = false;
        var newDisplaySourceCode = this.displaySourceCode;
        if (oldDisplaySourceCode !== newDisplaySourceCode)
            displayLocationChanged = true;
        else if (newDisplaySourceCode && (oldDisplayLineNumber !== this.displayLineNumber || oldDisplayColumnNumber !== this.displayColumnNumber))
            displayLocationChanged = true;

        var anyLocationChanged = false;
        if (displayLocationChanged)
            anyLocationChanged = true;
        else if (oldSourceCode !== this._sourceCode)
            anyLocationChanged = true;
        else if (this._sourceCode && (oldLineNumber !== this._lineNumber || oldColumnNumber !== this._columnNumber))
            anyLocationChanged = true;
        else if (this._sourceCode && (oldFormattedLineNumber !== this._formattedLineNumber || oldFormattedColumnNumber !== this._formattedColumnNumber))
            anyLocationChanged = true;

        if (displayLocationChanged || anyLocationChanged) {
            var oldData = {
                oldSourceCode,
                oldLineNumber,
                oldColumnNumber,
                oldFormattedLineNumber,
                oldFormattedColumnNumber,
                oldDisplaySourceCode,
                oldDisplayLineNumber,
                oldDisplayColumnNumber
            };
            if (displayLocationChanged)
                this.dispatchEventToListeners(WI.SourceCodeLocation.Event.DisplayLocationChanged, oldData);
            if (anyLocationChanged)
                this.dispatchEventToListeners(WI.SourceCodeLocation.Event.LocationChanged, oldData);
        }
    }

    _sourceCodeSourceMapAdded()
    {
        this._makeChangeAndDispatchChangeEventIfNeeded(null);
    }

    _sourceCodeFormatterDidChange()
    {
        this._makeChangeAndDispatchChangeEventIfNeeded(null);
    }
};

WI.SourceCodeLocation.DisplayLocationClassName = "display-location";

WI.SourceCodeLocation.LargeColumnNumber = 80;

WI.SourceCodeLocation.NameStyle = {
    None: "none", // File name not included.
    Short: "short", // Only the file name.
    Full: "full" // Full URL is used.
};

WI.SourceCodeLocation.ColumnStyle = {
    Hidden: "hidden",             // line and column numbers are not included.
    OnlyIfLarge: "only-if-large", // column numbers greater than 80 are shown.
    Shown: "shown"                // non-zero column numbers are shown.
};

WI.SourceCodeLocation.Event = {
    LocationChanged: "source-code-location-location-changed",
    DisplayLocationChanged: "source-code-location-display-location-changed"
};
