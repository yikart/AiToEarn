/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

// This tree builder attempts to match input text to output DOM node.
// This therefore doesn't do HTML5 tree construction like implicitly-closing
// specific HTML parent nodes depending on being in a particular node,
// it only does basic implicitly-closing. In general this tries to be a
// whitespace reformatter for input text and not generate the ultimate
// html tree that a browser would generate.
//
// When run with the XML option, all HTML specific cases are disabled.

HTMLTreeBuilderFormatter = class HTMLTreeBuilderFormatter
{
    constructor({isXML} = {})
    {
        this._isXML = !!isXML;
    }

    // Public

    get dom() { return this._dom; }

    begin()
    {
        this._dom = [];
        this._stackOfOpenElements = [];
    }

    pushParserNode(parserNode)
    {
        let containerNode = this._stackOfOpenElements.lastValue;
        if (!containerNode)
            this._pushParserNodeTopLevel(parserNode);
        else
            this._pushParserNodeStack(parserNode, containerNode);
    }

    end()
    {
        for (let node of this._stackOfOpenElements)
            node.implicitClose = true;
    }

    // Private

    _pushParserNodeTopLevel(parserNode)
    {
        if (parserNode.type === HTMLParser.NodeType.OpenTag) {
            let node = this._buildDOMNodeFromOpenTag(parserNode);
            this._dom.push(node);
            if (!this._isEmptyNode(parserNode, node))
                this._stackOfOpenElements.push(node);
            return;
        }

        if (parserNode.type === HTMLParser.NodeType.CloseTag) {
            let errorNode = this._buildErrorNodeFromCloseTag(parserNode);
            this._dom.push(errorNode);
            return;
        }

        let node = this._buildSimpleNodeFromParserNode(parserNode);
        this._dom.push(node);
    }

    _pushParserNodeStack(parserNode, containerNode)
    {
        if (parserNode.type === HTMLParser.NodeType.OpenTag) {
            let node = this._buildDOMNodeFromOpenTag(parserNode);
            let childrenArray = containerNode.children;
            if (!this._isXML) {
                this._implicitlyCloseHTMLNodesForOpenTag(parserNode, node);
                containerNode = this._stackOfOpenElements.lastValue;
                childrenArray = containerNode ? containerNode.children : this._dom;
            }
            childrenArray.push(node);
            if (!this._isEmptyNode(parserNode, node))
                this._stackOfOpenElements.push(node);
            return;
        }

        if (parserNode.type === HTMLParser.NodeType.CloseTag) {
            let tagName = this._isXML ? parserNode.name : parserNode.name.toLowerCase();
            let matchingOpenTagIndex = this._indexOfStackNodeMatchingTagNames([tagName]);

            // Found a matching tag, implicitly-close nodes.
            if (matchingOpenTagIndex !== -1) {
                let nodesToPop = this._stackOfOpenElements.length - matchingOpenTagIndex;
                for (let i = 0; i < nodesToPop - 1; ++i) {
                    let implicitlyClosingNode = this._stackOfOpenElements.pop();
                    implicitlyClosingNode.implicitClose = true;
                }
                let implicitlyClosingNode = this._stackOfOpenElements.pop();
                if (parserNode.pos) {
                    implicitlyClosingNode.closeTagPos = parserNode.pos;
                    implicitlyClosingNode.closeTagName = parserNode.name;
                }
                return;
            }

            // Did not find a matching tag to close.
            // Treat this as an error text node.
            let errorNode = this._buildErrorNodeFromCloseTag(parserNode);
            containerNode.children.push(errorNode);
            return;
        }

        let node = this._buildSimpleNodeFromParserNode(parserNode);
        containerNode.children.push(node);
    }

    _implicitlyCloseHTMLNodesForOpenTag(parserNode, node)
    {
        if (parserNode.closed)
            return;

        switch (node.lowercaseName) {
        // <body> closes <head>.
        case "body":
            this._implicitlyCloseTagNamesInsideParentTagNames(["head"]);
            break;

        // Inside <select>.
        case "option":
            this._implicitlyCloseTagNamesInsideParentTagNames(["option"], ["select"]);
            break;
        case "optgroup": {
            let didClose = this._implicitlyCloseTagNamesInsideParentTagNames(["optgroup"], ["select"]);
            if (!didClose)
                this._implicitlyCloseTagNamesInsideParentTagNames(["option"], ["select"]);
            break;
        }

        // Inside <ol>/<ul>.
        case "li":
            this._implicitlyCloseTagNamesInsideParentTagNames(["li"], ["ol", "ul"]);
            break;

        // Inside <dl>.
        case "dd":
        case "dt":
            this._implicitlyCloseTagNamesInsideParentTagNames(["dd", "dt"], ["dl"]);
            break;

        // Inside <table>.
        case "tr": {
            let didClose = this._implicitlyCloseTagNamesInsideParentTagNames(["tr"], ["table"]);
            if (!didClose)
                this._implicitlyCloseTagNamesInsideParentTagNames(["td", "th"], ["table"]);
            break;
        }
        case "td":
        case "th":
            this._implicitlyCloseTagNamesInsideParentTagNames(["td", "th"], ["table"]);
            break;
        case "tbody": {
            let didClose = this._implicitlyCloseTagNamesInsideParentTagNames(["thead"], ["table"]);
            if (!didClose)
                didClose = this._implicitlyCloseTagNamesInsideParentTagNames(["tr"], ["table"]);
            break;
        }
        case "tfoot": {
            let didClose = this._implicitlyCloseTagNamesInsideParentTagNames(["tbody"], ["table"]);
            if (!didClose)
                didClose = this._implicitlyCloseTagNamesInsideParentTagNames(["tr"], ["table"]);
            break;
        }
        case "colgroup":
            this._implicitlyCloseTagNamesInsideParentTagNames(["colgroup"], ["table"]);
            break;

        // Nodes that implicitly close a <p>. Normally this is only in <body> but we simplify to always.
        // https://html.spec.whatwg.org/multipage/parsing.html#parsing-main-inbody
        case "address":
        case "article":
        case "aside":
        case "blockquote":
        case "center":
        case "details":
        case "dialog":
        case "dir":
        case "div":
        case "dl":
        case "fieldset":
        case "figcaption":
        case "figure":
        case "footer":
        case "form":
        case "h1":
        case "h2":
        case "h3":
        case "h4":
        case "h5":
        case "h6":
        case "header":
        case "hgroup":
        case "hr":
        case "listing":
        case "main":
        case "menu":
        case "nav":
        case "ol":
        case "p":
        case "plaintext":
        case "pre":
        case "section":
        case "summary":
        case "table":
        case "ul":
        case "xmp":
            this._implicitlyCloseTagNamesInsideParentTagNames(["p"]);
            break;
        }
    }

    _implicitlyCloseTagNamesInsideParentTagNames(tagNames, containerScopeTagNames)
    {
        console.assert(!this._isXML, "Implicitly closing only happens in HTML. Also, names are compared case insensitively which would be invalid for XML.");

        let existingOpenTagIndex = this._indexOfStackNodeMatchingTagNames(tagNames);
        if (existingOpenTagIndex === -1)
            return false;

        // Disallow impliticly closing beyond the container tag boundary.
        if (containerScopeTagNames) {
            for (let i = existingOpenTagIndex + 1; i < this._stackOfOpenElements.length; ++i) {
                let stackNode = this._stackOfOpenElements[i];
                let name = stackNode.lowercaseName;
                if (containerScopeTagNames.includes(name))
                    return false;
            }
        }

        // Implicitly close tags.
        let nodesToPop = this._stackOfOpenElements.length - existingOpenTagIndex;
        for (let i = 0; i < nodesToPop; ++i) {
            let implicitlyClosingNode = this._stackOfOpenElements.pop();
            implicitlyClosingNode.implicitClose = true;
        }

        return true;
    }

    _indexOfStackNodeMatchingTagNames(tagNames)
    {
        for (let i = this._stackOfOpenElements.length - 1; i >= 0; --i) {
            let stackNode = this._stackOfOpenElements[i];
            let name = this._isXML ? stackNode.name : stackNode.lowercaseName;
            if (tagNames.includes(name))
                return i;
        }

        return -1;
    }

    _isEmptyNode(parserNode, node)
    {
        if (parserNode.closed)
            return true;

        if (!this._isXML && HTMLTreeBuilderFormatter.TagNamesWithoutChildren.has(node.lowercaseName))
            return true;

        return false;
    }

    _buildDOMNodeFromOpenTag(parserNode)
    {
        console.assert(parserNode.type === HTMLParser.NodeType.OpenTag);

        return {
            type: HTMLTreeBuilderFormatter.NodeType.Node,
            name: parserNode.name,
            lowercaseName: parserNode.name.toLowerCase(),
            children: [],
            attributes: parserNode.attributes,
            pos: parserNode.pos,
            selfClose: parserNode.closed,
            implicitClose: false,
        };
    }

    _buildErrorNodeFromCloseTag(parserNode)
    {
        console.assert(parserNode.type === HTMLParser.NodeType.CloseTag);

        return {
            type: HTMLTreeBuilderFormatter.NodeType.Error,
            raw: "</" + parserNode.name + ">",
            pos: parserNode.pos,
        };
    }

    _buildSimpleNodeFromParserNode(parserNode)
    {
        // Pass ErrorText through as Text.
        if (parserNode.type === HTMLParser.NodeType.ErrorText)
            parserNode.type = HTMLParser.NodeType.Text;

        // Pass these nodes right through: Text, Comment, Doctype, CData
        console.assert(parserNode.type === HTMLTreeBuilderFormatter.NodeType.Text || parserNode.type === HTMLTreeBuilderFormatter.NodeType.Comment || parserNode.type === HTMLTreeBuilderFormatter.NodeType.Doctype || parserNode.type === HTMLTreeBuilderFormatter.NodeType.CData);
        console.assert("data" in parserNode);

        return parserNode;
    }
};

HTMLTreeBuilderFormatter.TagNamesWithoutChildren = new Set([
    "area",
    "base",
    "basefont",
    "br",
    "canvas",
    "col",
    "command",
    "embed",
    "frame",
    "hr",
    "img",
    "input",
    "keygen",
    "link",
    "menuitem",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
]);

HTMLTreeBuilderFormatter.NodeType = {
    Text: "text",
    Node: "node",
    Comment: "comment",
    Doctype: "doctype",
    CData: "cdata",
    Error: "error",
};
