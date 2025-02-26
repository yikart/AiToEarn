/*
 * Copyright (C) 2013, 2014 Apple Inc. All rights reserved.
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

WI.JavaScriptBreakpoint = class JavaScriptBreakpoint extends WI.Breakpoint
{
    constructor(sourceCodeLocation, {contentIdentifier, resolved, disabled, condition, actions, ignoreCount, autoContinue} = {})
    {
        console.assert(sourceCodeLocation instanceof WI.SourceCodeLocation, sourceCodeLocation);
        console.assert(!contentIdentifier || typeof contentIdentifier === "string", contentIdentifier);
        console.assert(resolved === undefined || typeof resolved === "boolean", resolved);

        super({disabled, condition, actions, ignoreCount, autoContinue});

        this._id = null;
        this._sourceCodeLocation = sourceCodeLocation;

        let sourceCode = this._sourceCodeLocation.sourceCode;
        if (sourceCode) {
            this._contentIdentifier = sourceCode.contentIdentifier;
            console.assert(!contentIdentifier || contentIdentifier === this._contentIdentifier, "The content identifier from the source code should match the given value.");
        } else
            this._contentIdentifier = contentIdentifier || null;
        console.assert(this._contentIdentifier || this._isSpecial(), "There should always be a content identifier for a breakpoint.");

        this._scriptIdentifier = sourceCode instanceof WI.Script ? sourceCode.id : null;
        this._target = sourceCode instanceof WI.Script ? sourceCode.target : null;

        this._resolved = !!resolved;
        this._resolvedLocations = [];

        this._sourceCodeLocation.addEventListener(WI.SourceCodeLocation.Event.LocationChanged, this._sourceCodeLocationLocationChanged, this);
        this._sourceCodeLocation.addEventListener(WI.SourceCodeLocation.Event.DisplayLocationChanged, this._sourceCodeLocationDisplayLocationChanged, this);
    }

    // Static

    static supportsMicrotasks(parameter)
    {
        // COMPATIBILITY (iOS 13): Debugger.setPauseOnMicrotasks did not exist yet.
        return InspectorBackend.hasCommand("Debugger.setPauseOnMicrotasks", parameter);
    }

    static supportsDebuggerStatements(parameter)
    {
        // COMPATIBILITY (iOS 13.1): Debugger.setPauseOnDebuggerStatements did not exist yet.
        return InspectorBackend.hasCommand("Debugger.setPauseOnDebuggerStatements", parameter);
    }

    // Import / Export

    static fromJSON(json)
    {
        const sourceCode = null;
        return new WI.JavaScriptBreakpoint(new WI.SourceCodeLocation(sourceCode, json.lineNumber || 0, json.columnNumber || 0), {
            // The 'url' fallback is for transitioning from older frontends and should be removed.
            contentIdentifier: json.contentIdentifier || json.url,
            resolved: json.resolved,
            disabled: json.disabled,
            condition: json.condition,
            actions: json.actions?.map((actionJSON) => WI.BreakpointAction.fromJSON(actionJSON)) || [],
            ignoreCount: json.ignoreCount,
            autoContinue: json.autoContinue,
        });
    }

    toJSON(key)
    {
        // The id, scriptIdentifier, target, and resolved state are tied to the current session, so don't include them for serialization.
        let json = super.toJSON(key);
        if (this._contentIdentifier)
            json.contentIdentifier = this._contentIdentifier;
        if (isFinite(this._sourceCodeLocation.lineNumber))
            json.lineNumber = this._sourceCodeLocation.lineNumber;
        if (isFinite(this._sourceCodeLocation.columnNumber))
            json.columnNumber = this._sourceCodeLocation.columnNumber;
        if (key === WI.ObjectStore.toJSONSymbol)
            json[WI.objectStores.breakpoints.keyPath] = this._contentIdentifier + ":" + this._sourceCodeLocation.lineNumber + ":" + this._sourceCodeLocation.columnNumber;
        return json;
    }

    // Public

    get sourceCodeLocation() { return this._sourceCodeLocation; }
    get contentIdentifier() { return this._contentIdentifier; }
    get scriptIdentifier() { return this._scriptIdentifier; }
    get target() { return this._target; }
    get resolvedLocations() { return this._resolvedLocations; }

    get displayName()
    {
        switch (this) {
        case WI.debuggerManager.debuggerStatementsBreakpoint:
            return WI.repeatedUIString.debuggerStatements();

        case WI.debuggerManager.allExceptionsBreakpoint:
            return WI.repeatedUIString.allExceptions();

        case WI.debuggerManager.uncaughtExceptionsBreakpoint:
            return WI.repeatedUIString.uncaughtExceptions();

        case WI.debuggerManager.assertionFailuresBreakpoint:
            return WI.repeatedUIString.assertionFailures();

        case WI.debuggerManager.allMicrotasksBreakpoint:
            return WI.repeatedUIString.allMicrotasks();
        }

        return this._sourceCodeLocation.displayLocationString()
    }

    get special()
    {
        switch (this) {
        case WI.debuggerManager.debuggerStatementsBreakpoint:
        case WI.debuggerManager.allExceptionsBreakpoint:
        case WI.debuggerManager.uncaughtExceptionsBreakpoint:
        case WI.debuggerManager.assertionFailuresBreakpoint:
        case WI.debuggerManager.allMicrotasksBreakpoint:
            return true;
        }

        if (this._isSpecial())
            return true;

        return super.special;
    }

    get removable()
    {
        switch (this) {
        case WI.debuggerManager.debuggerStatementsBreakpoint:
        case WI.debuggerManager.allExceptionsBreakpoint:
        case WI.debuggerManager.uncaughtExceptionsBreakpoint:
            return false;
        }

        return super.removable;
    }

    get editable()
    {
        switch (this) {
        case WI.debuggerManager.debuggerStatementsBreakpoint:
            // COMPATIBILITY (iOS 14): Debugger.setPauseOnDebuggerStatements did not have an "options" parameter yet.
            return WI.JavaScriptBreakpoint.supportsDebuggerStatements("options");

        case WI.debuggerManager.allExceptionsBreakpoint:
        case WI.debuggerManager.uncaughtExceptionsBreakpoint:
            // COMPATIBILITY (iOS 14): Debugger.setPauseOnExceptions did not have an "options" parameter yet.
            return InspectorBackend.hasCommand("Debugger.setPauseOnExceptions", "options");

        case WI.debuggerManager.assertionFailuresBreakpoint:
            // COMPATIBILITY (iOS 14): Debugger.setPauseOnAssertions did not have an "options" parameter yet.
            return InspectorBackend.hasCommand("Debugger.setPauseOnAssertions", "options");

        case WI.debuggerManager.allMicrotasksBreakpoint:
            // COMPATIBILITY (iOS 14): Debugger.setPauseOnMicrotasks did not have an "options" parameter yet.
            return WI.JavaScriptBreakpoint.supportsMicrotasks("options");
        }

        return true;
    }

    get identifier()
    {
        return this._id;
    }

    set identifier(id)
    {
        this._id = id || null;
    }

    get resolved()
    {
        return super.resolved && this._resolved;
    }

    set resolved(resolved)
    {
        if (this._resolved === resolved)
            return;

        console.assert(!resolved || this._sourceCodeLocation.sourceCode || this._isSpecial(), "Breakpoints must have a SourceCode to be resolved.", this);

        this._resolved = resolved || false;

        this.dispatchEventToListeners(WI.JavaScriptBreakpoint.Event.ResolvedStateDidChange);
    }

    addResolvedLocation(location)
    {
        console.assert(!this._isSpecial(), this);
        console.assert(location instanceof WI.SourceCodeLocation, location);
        console.assert(!this.hasResolvedLocation(location), location, this._resolvedLocations);

        this._resolvedLocations.push(location);
        this.resolved = true;
    }

    hasResolvedLocation(location)
    {
        console.assert(!this._isSpecial(), this);
        console.assert(location instanceof WI.SourceCodeLocation, location);

        return this._resolvedLocations.some((resolvedLocation) => resolvedLocation.isEqual(location));
    }

    clearResolvedLocations()
    {
        console.assert(!this._isSpecial(), this);

        this._resolvedLocations = [];
        this.resolved = false;
    }

    remove()
    {
        super.remove();

        WI.debuggerManager.removeBreakpoint(this);
    }

    saveIdentityToCookie(cookie)
    {
        cookie["javascript-breakpoint-content-identifier"] = this._contentIdentifier;
        cookie["javascript-breakpoint-line-number"] = this._sourceCodeLocation.lineNumber;
        cookie["javascript-breakpoint-column-number"] = this._sourceCodeLocation.columnNumber;
    }

    // Private

    _isSpecial()
    {
        return this._sourceCodeLocation.isEqual(WI.SourceCodeLocation.specialBreakpointLocation);
    }

    _sourceCodeLocationLocationChanged(event)
    {
        this.dispatchEventToListeners(WI.JavaScriptBreakpoint.Event.LocationDidChange, event.data);
    }

    _sourceCodeLocationDisplayLocationChanged(event)
    {
        this.dispatchEventToListeners(WI.JavaScriptBreakpoint.Event.DisplayLocationDidChange, event.data);
    }
};

WI.JavaScriptBreakpoint.TypeIdentifier = "javascript-breakpoint";

WI.JavaScriptBreakpoint.Event = {
    ResolvedStateDidChange: "javascript-breakpoint-resolved-state-did-change",
    LocationDidChange: "javascript-breakpoint-location-did-change",
    DisplayLocationDidChange: "javascript-breakpoint-display-location-did-change",
};

WI.JavaScriptBreakpoint.ReferencePage = WI.ReferencePage.JavaScriptBreakpoints;
