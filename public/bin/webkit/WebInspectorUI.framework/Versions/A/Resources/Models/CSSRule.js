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

WI.CSSRule = class CSSRule extends WI.Object
{
    constructor(nodeStyles, ownerStyleSheet, id, type, sourceCodeLocation, selectorText, selectors, matchedSelectorIndices, style, groupings, isImplicitlyNested)
    {
        super();

        console.assert(nodeStyles);
        this._nodeStyles = nodeStyles;

        this._ownerStyleSheet = ownerStyleSheet || null;
        this._id = id || null;
        this._type = type || null;
        this._initialState = null;
        this._isImplicitlyNested = isImplicitlyNested || false;

        this.update(sourceCodeLocation, selectorText, selectors, matchedSelectorIndices, style, groupings, true);
    }

    // Public

    get ownerStyleSheet() { return this._ownerStyleSheet; }
    get id() { return this._id; }
    get type() { return this._type; }
    get initialState() { return this._initialState; }
    get sourceCodeLocation() { return this._sourceCodeLocation; }
    get selectors() { return this._selectors; }
    get matchedSelectorIndices() { return this._matchedSelectorIndices; }
    get style() { return this._style; }
    get groupings() { return this._groupings; }
    get isImplicitlyNested() { return this._isImplicitlyNested; }

    get editable()
    {
        return !!this._id && this._type !== WI.CSSStyleSheet.Type.UserAgent;
    }

    get selectorText()
    {
        return this._selectorText;
    }

    setSelectorText(selectorText)
    {
        console.assert(this.editable);
        if (!this.editable)
            return Promise.reject();

        return this._nodeStyles.changeRuleSelector(this, selectorText).then(this._selectorResolved.bind(this));
    }

    update(sourceCodeLocation, selectorText, selectors, matchedSelectorIndices, style, groupings)
    {
        sourceCodeLocation = sourceCodeLocation || null;
        selectorText = selectorText || "";
        selectors = selectors || [];
        matchedSelectorIndices = matchedSelectorIndices || [];
        style = style || null;
        groupings = groupings || [];

        if (this._style)
            this._style.ownerRule = null;

        this._sourceCodeLocation = sourceCodeLocation;
        this._selectorText = selectorText;
        this._selectors = selectors;
        this._matchedSelectorIndices = matchedSelectorIndices;
        this._style = style;
        this._groupings = groupings;

        if (this._style)
            this._style.ownerRule = this;
    }

    isEqualTo(rule)
    {
        if (!rule)
            return false;

        return Object.shallowEqual(this._id, rule.id);
    }

    // Protected

    get nodeStyles()
    {
        return this._nodeStyles;
    }

    // Private

    // This method only needs to be called for CSS rules that don't match the selected DOM node.
    // CSS rules that match the selected DOM node get updated by WI.DOMNodeStyles.prototype._parseRulePayload.
    _selectorResolved(rulePayload)
    {
        if (!rulePayload)
            return;

        let selectorText = rulePayload.selectorList.text;
        if (selectorText === this._selectorText)
            return;

        let selectors = WI.DOMNodeStyles.parseSelectorListPayload(rulePayload.selectorList);

        let sourceCodeLocation = null;
        let sourceRange = rulePayload.selectorList.range;
        if (sourceRange) {
            sourceCodeLocation = WI.DOMNodeStyles.createSourceCodeLocation(rulePayload.sourceURL, {
                line: sourceRange.startLine,
                column: sourceRange.startColumn,
                documentNode: this._nodeStyles.node.ownerDocument,
            });
        }

        if (this._ownerStyleSheet) {
            if (!sourceCodeLocation && sourceRange)
                sourceCodeLocation = this._ownerStyleSheet.createSourceCodeLocation(sourceRange.startLine, sourceRange.startColumn);
            sourceCodeLocation = this._ownerStyleSheet.offsetSourceCodeLocation(sourceCodeLocation);
        }

        this.update(sourceCodeLocation, selectorText, selectors, [], this._style, this._groupings);
    }
};
