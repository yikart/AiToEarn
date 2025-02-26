/*
 * Copyright (C) 2019-2022 Apple Inc. All rights reserved.
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

WI.CSSGrouping = class CSSGrouping extends WI.Object
{
    constructor(nodeStyles, type, {ownerStyleSheet, id, text, sourceCodeLocation} = {})
    {
        super();
        
        console.assert(nodeStyles);
        console.assert(Object.values(CSSGrouping.Type).includes(type));
        console.assert(!text || (typeof text === "string" && text.length));
        console.assert(!sourceCodeLocation || sourceCodeLocation instanceof WI.SourceCodeLocation);

        this._nodeStyles = nodeStyles;
        this._type = type;

        this._ownerStyleSheet = ownerStyleSheet || null;
        this._id = id || null;
        this._text = text || null;
        this._sourceCodeLocation = sourceCodeLocation || null;
    }

    // Public

    get ownerStyleSheet() { return this._ownerStyleSheet; }
    get id() { return this._id; }
    get type() { return this._type; }
    get sourceCodeLocation() { return this._sourceCodeLocation; }

    get editable()
    {
        return !!this._id && !!this.ownerStyleSheet;
    }

    get text()
    {
        return this._text;
    }

    async setText(newText)
    {
        console.assert(this.editable);
        if (!this.editable)
            throw "Cannot set text on non-editable CSSGrouping.";

        newText ||= "";

        this._nodeStyles.ignoreNextContentDidChangeForStyleSheet = this._ownerStyleSheet;

        let target = WI.assumingMainTarget();
        let {grouping: groupingPayload} = await target.CSSAgent.setGroupingHeaderText(this._id, newText);

        target.DOMAgent.markUndoableState();
        await this._nodeStyles.refresh();

        console.assert(groupingPayload.type == this._type);

        console.assert(groupingPayload.ruleId);
        console.assert(groupingPayload.text);

        this._id = groupingPayload.ruleId;
        this._text = groupingPayload.text;

        let location = {};
        if (groupingPayload.sourceRange) {
            location.line = groupingPayload.sourceRange.startLine;
            location.column = groupingPayload.sourceRange.startColumn;
            location.documentNode = this._nodeStyles.node.ownerDocument;
        }

        let groupingSourceCodeLocation = WI.DOMNodeStyles.createSourceCodeLocation(groupingPayload.sourceURL, location);
        this._sourceCodeLocation = WI.cssManager.styleSheetForIdentifier(this._id.styleSheetId).offsetSourceCodeLocation(groupingSourceCodeLocation);

        this.dispatchEventToListeners(WI.CSSGrouping.Event.TextChanged);
    }

    get isMedia()
    {
        return this._type === WI.CSSGrouping.Type.MediaRule
            || this._type === WI.CSSGrouping.Type.MediaImportRule
            || this._type === WI.CSSGrouping.Type.MediaLinkNode
            || this._type === WI.CSSGrouping.Type.MediaStyleNode;
    }

    get isSupports()
    {
        return this._type === WI.CSSGrouping.Type.SupportsRule;
    }

    get isLayer()
    {
        return this._type === WI.CSSGrouping.Type.LayerRule
            || this._type === WI.CSSGrouping.Type.LayerImportRule;
    }

    get isContainer()
    {
        return this._type === WI.CSSGrouping.Type.ContainerRule;
    }

    get isStyle()
    {
        return this._type === WI.CSSGrouping.Type.StyleRule;
    }

    get prefix()
    {
        if (this.isSupports)
            return "@supports";

        if (this.isLayer)
            return "@layer";

        if (this.isContainer)
            return "@container";

        if (this.isStyle)
            return null;

        console.assert(this.isMedia);
        return "@media";
    }
};

WI.CSSGrouping.Type = {
    MediaRule: "media-rule",
    MediaImportRule: "media-import-rule",
    MediaLinkNode: "media-link-node",
    MediaStyleNode: "media-style-node",
    SupportsRule: "supports-rule",
    LayerRule: "layer-rule",
    LayerImportRule: "layer-import-rule",
    ContainerRule: "container-rule",
    StyleRule: "style-rule",
};

WI.CSSGrouping.Event = {
    TextChanged: "css-grouping-event-grouping-text-changed",
};
