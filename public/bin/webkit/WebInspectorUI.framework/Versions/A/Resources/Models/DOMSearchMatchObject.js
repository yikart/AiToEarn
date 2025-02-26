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

WI.DOMSearchMatchObject = class DOMSearchMatchObject
{
    constructor(resource, domNode, title, searchTerm, textRange)
    {
        console.assert(resource instanceof WI.Resource);
        console.assert(domNode instanceof WI.DOMNode);
        console.assert(textRange instanceof WI.TextRange, textRange);

        this._resource = resource;
        this._domNode = domNode;
        this._title = title;
        this._searchTerm = searchTerm;
        this._textRange = textRange;
        this._sourceCodeTextRange = null;
    }

    // Static

    static titleForDOMNode(domNode)
    {
        switch (domNode.nodeType()) {
        case Node.ELEMENT_NODE:
            var title = "<" + domNode.nodeNameInCorrectCase();
            for (var attribute of domNode.attributes()) {
                title += " " + attribute.name;
                if (attribute.value.length)
                    title += "=\"" + attribute.value + "\"";
            }
            return title + ">";

        case Node.TEXT_NODE:
            return "\"" + domNode.nodeValue() + "\"";

        case Node.COMMENT_NODE:
            return "<!--" + domNode.nodeValue() + "-->";

        case Node.DOCUMENT_TYPE_NODE:
            var title = "<!DOCTYPE " + domNode.nodeName();
            if (domNode.publicId) {
                title += " PUBLIC \"" + domNode.publicId + "\"";
                if (domNode.systemId)
                    title += " \"" + domNode.systemId + "\"";
            } else if (domNode.systemId)
                title += " SYSTEM \"" + domNode.systemId + "\"";

            return title + ">";

        case Node.CDATA_SECTION_NODE:
            return "<![CDATA[" + domNode + "]]>";

        case Node.PROCESSING_INSTRUCTION_NODE:
            var data = domNode.nodeValue();
            var dataString = data.length ? " " + data : "";
            var title = "<?" + domNode.nodeNameInCorrectCase() + dataString + "?>";
            return title;

        default:
            console.error("Unknown DOM node type: ", domNode.nodeType());
            return domNode.nodeNameInCorrectCase();
        }
    }

    // Public

    get textRange() { return this._textRange; }

    get resource()
    {
        return this._resource;
    }

    get domNode()
    {
        return this._domNode;
    }

    get title()
    {
        return this._title;
    }

    get className()
    {
        if (!this._className)
            this._className = this._generateClassName();

        return this._className;
    }

    get searchTerm()
    {
        return this._searchTerm;
    }

    get sourceCodeTextRange()
    {
        this._sourceCodeTextRange ??= this._resource.createSourceCodeTextRange(this._textRange);

        return this._sourceCodeTextRange;
    }

    saveIdentityToCookie(cookie)
    {
        cookie[WI.DOMSearchMatchObject.URLCookieKey] = this._resource.url.hash;
        cookie[WI.DOMSearchMatchObject.TitleKey] = this._title;
        cookie[WI.DOMSearchMatchObject.TextRangeKey] = [this._textRange.startLine, this._textRange.startColumn, this._textRange.endLine, this._textRange.endColumn].join();
    }

    // Private

    _generateClassName()
    {
        switch (this._domNode.nodeType()) {
        case Node.ELEMENT_NODE:
            return WI.DOMSearchMatchObject.DOMMatchElementIconStyleClassName;

        case Node.TEXT_NODE:
            return WI.DOMSearchMatchObject.DOMMatchTextNodeIconStyleClassName;

        case Node.COMMENT_NODE:
            return WI.DOMSearchMatchObject.DOMMatchCommentIconStyleClassName;

        case Node.DOCUMENT_TYPE_NODE:
            return WI.DOMSearchMatchObject.DOMMatchDocumentTypeIconStyleClassName;

        case Node.CDATA_SECTION_NODE:
            return WI.DOMSearchMatchObject.DOMMatchCharacterDataIconStyleClassName;

        case Node.PROCESSING_INSTRUCTION_NODE:
            // <rdar://problem/12800950> Need icon for DOCUMENT_FRAGMENT_NODE and PROCESSING_INSTRUCTION_NODE
            return WI.DOMSearchMatchObject.DOMMatchDocumentTypeIconStyleClassName;

        default:
            console.error("Unknown DOM node type: ", this._domNode.nodeType());
            return WI.DOMSearchMatchObject.DOMMatchNodeIconStyleClassName;
        }
    }
};

WI.DOMSearchMatchObject.DOMMatchElementIconStyleClassName = "dom-match-element-icon";
WI.DOMSearchMatchObject.DOMMatchTextNodeIconStyleClassName = "dom-match-text-node-icon";
WI.DOMSearchMatchObject.DOMMatchCommentIconStyleClassName = "dom-match-comment-icon";
WI.DOMSearchMatchObject.DOMMatchDocumentTypeIconStyleClassName = "dom-match-document-type-icon";
WI.DOMSearchMatchObject.DOMMatchCharacterDataIconStyleClassName = "dom-match-character-data-icon";
WI.DOMSearchMatchObject.DOMMatchNodeIconStyleClassName = "dom-match-node-icon";

WI.DOMSearchMatchObject.TypeIdentifier = "dom-search-match-object";
WI.DOMSearchMatchObject.URLCookieKey = "resource-url";
WI.DOMSearchMatchObject.TitleKey = "title";
WI.DOMSearchMatchObject.TextRangeKey = "text-range";
