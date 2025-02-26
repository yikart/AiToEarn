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

(function() {
    if (WI.dontLocalizeUserInterface)
        return;

    let localizedStringsURL = InspectorFrontendHost.localizedStringsURL;
    console.assert(localizedStringsURL);
    if (localizedStringsURL)
        document.write("<script src=\"" + localizedStringsURL + "\"></script>");
})();

WI.unlocalizedString = function(string)
{
    // Intentionally do nothing, since this is for engineering builds
    // (such as in Debug UI) or in text that is standardized in English.
    // For example, CSS property names and values are never localized.
    return string;
};

WI.UIString = function(string, key, comment)
{
    "use strict";

    if (WI.dontLocalizeUserInterface)
        return string;

    // UIString(string, comment)
    if (arguments.length === 2) {
        comment = key;
        key = undefined;
    }

    key = key || string;

    if (window.localizedStrings && key in window.localizedStrings)
        return window.localizedStrings[key];

    if (!window.localizedStrings)
        console.error(`Attempted to load localized string "${key}" before localizedStrings was initialized.`, comment);

    if (!this._missingLocalizedStrings)
        this._missingLocalizedStrings = {};

    if (!(key in this._missingLocalizedStrings)) {
        console.error(`Localized string "${key}" was not found.`, comment);
        this._missingLocalizedStrings[key] = true;
    }

    return "LOCALIZED STRING NOT FOUND";
};

WI.repeatedUIString = {};

WI.repeatedUIString.timelineRecordLayout = function() {
    return WI.UIString("Layout", "Layout @ Timeline record", "Layout phase timeline records");
};

WI.repeatedUIString.timelineRecordPaint = function() {
    return WI.UIString("Paint", "Paint @ Timeline record", "Paint (render) phase timeline records");
};

WI.repeatedUIString.timelineRecordComposite = function() {
    return WI.UIString("Composite", "Composite @ Timeline record", "Composite phase timeline records, where graphic layers are combined");
};

WI.repeatedUIString.debuggerStatements = function() {
    return WI.UIString("Debugger Statements", "Debugger Statements @ JavaScript Breakpoint", "Break (pause) on debugger statements");
};

WI.repeatedUIString.allExceptions = function() {
    return WI.UIString("All Exceptions", "All Exceptions @ JavaScript Breakpoint", "Break (pause) on all exceptions");
};

WI.repeatedUIString.uncaughtExceptions = function() {
    return WI.UIString("Uncaught Exceptions", "Uncaught Exceptions @ JavaScript Breakpoint", "Break (pause) on uncaught (unhandled) exceptions");
};

WI.repeatedUIString.assertionFailures = function() {
    return WI.UIString("Assertion Failures", "Assertion Failures @ JavaScript Breakpoint", "Break (pause) when console.assert() fails");
};

WI.repeatedUIString.allMicrotasks = function() {
    return WI.UIString("All Microtasks", "All Microtasks @ JavaScript Breakpoint", "Break (pause) on all microtasks");
};

WI.repeatedUIString.allAnimationFrames = function() {
    return WI.UIString("All Animation Frames", "All Animation Frames @ Event Breakpoint", "Break (pause) on All animation frames");
};

WI.repeatedUIString.allIntervals = function() {
    return WI.UIString("All Intervals", "All Intervals @ Event Breakpoint", "Break (pause) on all intervals");
};

WI.repeatedUIString.allEvents = function() {
    return WI.UIString("All Events", "All Events @ Event Breakpoint", "Break (pause) on all events");
};

WI.repeatedUIString.allTimeouts = function() {
    return WI.UIString("All Timeouts", "All Timeouts @ Event Breakpoint", "Break (pause) on all timeouts");
};

WI.repeatedUIString.allRequests = function() {
    return WI.UIString("All Requests", "A submenu item of 'Break on' that breaks (pauses) before all network requests");
};

WI.repeatedUIString.fetch = function() {
    return WI.UIString("Fetch", "Resource loaded via 'fetch' method");
};

WI.repeatedUIString.revealInDOMTree = function() {
    return WI.UIString("Reveal in DOM Tree", "Open Elements tab and select this node in DOM tree");
};

WI.repeatedUIString.showTransparencyGridTooltip = function() {
    return WI.UIString("Show transparency grid", "Show transparency grid (tooltip)", "Tooltip for showing the checkered transparency grid under images and canvases")
};
