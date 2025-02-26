/*
 * Copyright (C) 2013, 2015 Apple Inc. All rights reserved.
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

WI.DOMTreeElementPathComponent = class DOMTreeElementPathComponent extends WI.HierarchicalPathComponent
{
    constructor(domTreeElement, representedObject)
    {
        var node = domTreeElement.representedObject;

        var title = null;

        switch (node.nodeType()) {
        case Node.ELEMENT_NODE:
            if (node.isPseudoElement()) {
                title = "::" + node.pseudoType();
            } else {
                title = node.displayName;
            }
            break;

        case Node.TEXT_NODE:
            title = "\"" + node.nodeValue().truncateEnd(32) + "\"";
            break;

        case Node.COMMENT_NODE:
            title = "<!--" + node.nodeValue().truncateEnd(32) + "-->";
            break;

        case Node.DOCUMENT_TYPE_NODE:
            title = "<!DOCTYPE>";
            break;

        case Node.DOCUMENT_NODE:
            title = node.nodeNameInCorrectCase();
            break;

        case Node.CDATA_SECTION_NODE:
            title = "<![CDATA[" + node.truncateEnd(32) + "]]>";
            break;

        case Node.DOCUMENT_FRAGMENT_NODE:
            // FIXME: At some point we might want a different icon for this.
            // <rdar://problem/12800950> Need icon for DOCUMENT_FRAGMENT_NODE and PROCESSING_INSTRUCTION_NODE
            if (node.shadowRootType())
                title = WI.UIString("Shadow Content");
            else
                title = node.displayName;
            break;

        case Node.PROCESSING_INSTRUCTION_NODE:
            // FIXME: At some point we might want a different icon for this.
            // <rdar://problem/12800950> Need icon for DOCUMENT_FRAGMENT_NODE and PROCESSING_INSTRUCTION_NODE.
            title = node.nodeNameInCorrectCase();
            break;

        default:
            console.error("Unknown DOM node type: ", node.nodeType());
            title = node.nodeNameInCorrectCase();
        }

        super(title, DOMTreeElementPathComponent.iconClassNameForNode(node), representedObject || domTreeElement.representedObject);

        this._domTreeElement = domTreeElement;
    }

    static iconClassNameForNode(domNode)
    {
        switch (domNode.nodeType()) {
        case Node.ELEMENT_NODE:
            if (domNode.isPseudoElement())
                return WI.DOMTreeElementPathComponent.DOMPseudoElementIconStyleClassName;
            return WI.DOMTreeElementPathComponent.DOMElementIconStyleClassName;

        case Node.TEXT_NODE:
            return WI.DOMTreeElementPathComponent.DOMTextNodeIconStyleClassName;

        case Node.COMMENT_NODE:
            return WI.DOMTreeElementPathComponent.DOMCommentIconStyleClassName;

        case Node.DOCUMENT_TYPE_NODE:
            return WI.DOMTreeElementPathComponent.DOMDocumentTypeIconStyleClassName;

        case Node.DOCUMENT_NODE:
            return WI.DOMTreeElementPathComponent.DOMDocumentIconStyleClassName;

        case Node.CDATA_SECTION_NODE:
            return WI.DOMTreeElementPathComponent.DOMCharacterDataIconStyleClassName;

        case Node.DOCUMENT_FRAGMENT_NODE:
            // FIXME: At some point we might want a different icon for this.
            // <rdar://problem/12800950> Need icon for DOCUMENT_FRAGMENT_NODE and PROCESSING_INSTRUCTION_NODE
            return WI.DOMTreeElementPathComponent.DOMDocumentTypeIconStyleClassName;

        case Node.PROCESSING_INSTRUCTION_NODE:
            // FIXME: At some point we might want a different icon for this.
            // <rdar://problem/12800950> Need icon for DOCUMENT_FRAGMENT_NODE and PROCESSING_INSTRUCTION_NODE.
            return WI.DOMTreeElementPathComponent.DOMDocumentTypeIconStyleClassName;
        }

        console.error("Unknown DOM node type: ", domNode.nodeType());
        return WI.DOMTreeElementPathComponent.DOMNodeIconStyleClassName;
    }

    // Public

    get domTreeElement()
    {
        return this._domTreeElement;
    }

    get previousSibling()
    {
        if (!this._domTreeElement.previousSibling)
            return null;
        return new WI.DOMTreeElementPathComponent(this._domTreeElement.previousSibling);
    }

    get nextSibling()
    {
        if (!this._domTreeElement.nextSibling)
            return null;
        if (this._domTreeElement.nextSibling.isCloseTag())
            return null;
        return new WI.DOMTreeElementPathComponent(this._domTreeElement.nextSibling);
    }

    // Protected

    mouseOver()
    {
        let node = this._domTreeElement.representedObject;
        node.highlight();
    }

    mouseOut()
    {
        WI.domManager.hideDOMNodeHighlight();
    }
};

WI.DOMTreeElementPathComponent.DOMElementIconStyleClassName = "dom-element-icon";
WI.DOMTreeElementPathComponent.DOMPseudoElementIconStyleClassName = "dom-pseudo-element-icon";
WI.DOMTreeElementPathComponent.DOMTextNodeIconStyleClassName = "dom-text-node-icon";
WI.DOMTreeElementPathComponent.DOMCommentIconStyleClassName = "dom-comment-icon";
WI.DOMTreeElementPathComponent.DOMDocumentTypeIconStyleClassName = "dom-document-type-icon";
WI.DOMTreeElementPathComponent.DOMDocumentIconStyleClassName = "dom-document-icon";
WI.DOMTreeElementPathComponent.DOMCharacterDataIconStyleClassName = "dom-character-data-icon";
WI.DOMTreeElementPathComponent.DOMNodeIconStyleClassName = "dom-node-icon";
