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

HTMLFormatter = class HTMLFormatter
{
    constructor(sourceText, sourceType, builder, indentString = "    ")
    {
        console.assert(typeof sourceText === "string");
        console.assert(Object.values(HTMLFormatter.SourceType).includes(sourceType));

        this._sourceType = sourceType;

        this._success = false;

        let dom = (function() {
            try {
                let options = {
                    isXML: sourceType === HTMLFormatter.SourceType.XML,
                };
                let parser = new HTMLParser;
                let treeBuilder = new HTMLTreeBuilderFormatter(options);
                parser.parseDocument(sourceText, treeBuilder, options);
                return treeBuilder.dom;
            } catch (e) {
                console.error("Unexpected HTMLFormatter Error", e);
                return null;
            }
        })();

        if (!dom)
            return;

        this._sourceText = sourceText;

        this._builder = builder;
        if (!this._builder) {
            this._builder = new FormatterContentBuilder(indentString);
            this._builder.setOriginalLineEndings(this._sourceText.lineEndings());
        }

        this._walkArray(dom, null);

        this._builder.appendNewline();
        this._builder.appendMapping(this._sourceText.length);

        this._success = true;
    }

    // Public

    get success() { return this._success; }

    get formattedText()
    {
        if (!this._success)
            return null;
        return this._builder.formattedContent;
    }

    get sourceMapData()
    {
        if (!this._success)
            return null;
        return this._builder.sourceMapData;
    }

    // Private

    _walk(node, parent)
    {
        if (!node)
            return;

        this._before(node, parent);
        this._walkArray(node.children, node);
        this._after(node, parent);
    }

    _walkArray(children, parent)
    {
        if (!children)
            return;

        this._previousSiblingNode = null;

        for (let child of children) {
            this._walk(child, parent);
            this._previousSiblingNode = child;
        }
    }

    _shouldHaveNoChildren(node)
    {
        switch (this._sourceType) {
        case HTMLFormatter.SourceType.HTML:
            return HTMLTreeBuilderFormatter.TagNamesWithoutChildren.has(node.lowercaseName);
        case HTMLFormatter.SourceType.XML:
            return false;
        }

        console.assert(false, "Unknown source type", this._sourceType);
        return false;
    }

    _shouldHaveInlineContent(node)
    {
        if (node.__shouldHaveNoChildren)
            return true;

        let children = node.children;
        if (!children)
            return true;
        if (!children.length)
            return true;
        if (children.length === 1 && node.children[0].type === HTMLTreeBuilderFormatter.NodeType.Text)
            return true;

        return false;
    }

    _hasMultipleNewLines(text)
    {
        let firstIndex = text.indexOf("\n");
        if (firstIndex === -1)
            return false;

        let secondIndex = text.indexOf("\n", firstIndex + 1);
        if (secondIndex === -1)
            return false;

        return true;
    }

    _buildAttributeString(attr)
    {
        this._builder.appendSpace();

        let {name, value, quote, namePos, valuePos} = attr;

        if (value !== undefined) {
            let q;
            switch (quote) {
            case HTMLParser.AttrQuoteType.None:
                q = ``;
                break;
            case HTMLParser.AttrQuoteType.Single:
                q = `'`;
                break;
            case HTMLParser.AttrQuoteType.Double:
                q = `"`;
                break;
            default:
                console.assert(false, "Unexpected quote type", quote);
                q = ``;
                break;
            }

            this._builder.appendToken(name, namePos);
            this._builder.appendNonToken("=");
            if (q)
                this._builder.appendStringWithPossibleNewlines(q + value + q, valuePos);
            else
                this._builder.appendToken(value, valuePos);
            return;
        }

        console.assert(quote === HTMLParser.AttrQuoteType.None);
        this._builder.appendToken(name, namePos);
    }

    _before(node, parent)
    {
        if (node.type === HTMLTreeBuilderFormatter.NodeType.Node) {
            node.__shouldHaveNoChildren = this._shouldHaveNoChildren(node);
            node.__inlineContent = this._shouldHaveInlineContent(node);

            if (this._previousSiblingNode && this._previousSiblingNode.type === HTMLTreeBuilderFormatter.NodeType.Text)
                this._builder.appendNewline();

            this._builder.appendToken("<" + node.name, node.pos);
            if (node.attributes) {
                for (let attr of node.attributes)
                    this._buildAttributeString(attr);
            }
            if (node.selfClose)
                this._builder.appendNonToken("/");
            this._builder.appendNonToken(">");

            if (node.selfClose || node.__shouldHaveNoChildren)
                this._builder.appendNewline();

            if (!node.__inlineContent) {
                if (node.lowercaseName !== "html" || this._sourceType === HTMLFormatter.SourceType.XML)
                    this._builder.indent();
                this._builder.appendNewline();
            }
            return;
        }

        if (node.type === HTMLTreeBuilderFormatter.NodeType.Text) {
            // <script> and <style> inline content.
            if (parent && parent.type === HTMLTreeBuilderFormatter.NodeType.Node) {
                switch (parent.lowercaseName) {
                case "script":
                    if (this._formatScript(node.data, parent, node))
                        return;
                    break;
                case "style":
                    if (this._formatStyle(node.data, parent, node))
                        return;
                    break;
                }
            }

            // Whitespace only text nodes.
            let textString = node.data;
            if (/^\s*$/.test(textString)) {
                // Collapse multiple blank lines to a single blank line.
                if (this._hasMultipleNewLines(textString))
                    this._builder.appendNewline(true);
                return;
            }

            this._builder.appendStringWithPossibleNewlines(textString, node.pos);
            return;
        }

        if (node.type === HTMLTreeBuilderFormatter.NodeType.Comment) {
            let openerString = node.opener ? node.opener : "<!--";
            let commentString = openerString + node.data;
            this._builder.appendStringWithPossibleNewlines(commentString, node.pos);
            return;
        }

        if (node.type === HTMLTreeBuilderFormatter.NodeType.Doctype) {
            let doctypeString = "<" + node.raw + node.data;
            this._builder.appendStringWithPossibleNewlines(doctypeString, node.pos);
            return;
        }

        if (node.type === HTMLTreeBuilderFormatter.NodeType.CData) {
            let cdataString = "<![CDATA[" + node.data;
            this._builder.appendStringWithPossibleNewlines(cdataString, node.pos);
            return;
        }

        if (node.type === HTMLTreeBuilderFormatter.NodeType.Error) {
            let rawText = node.raw;
            this._builder.appendStringWithPossibleNewlines(rawText, node.pos);
            this._builder.appendNewline();
            return;
        }

        console.assert(false, "Unhandled node type", node.type, node);
    }

    _after(node, parent)
    {
        if (node.type === HTMLTreeBuilderFormatter.NodeType.Node) {
            if (node.selfClose)
                return;
            if (node.__shouldHaveNoChildren)
                return;
            if (!node.__inlineContent) {
                if (node.lowercaseName !== "html" || this._sourceType === HTMLFormatter.SourceType.XML)
                    this._builder.dedent();
                this._builder.appendNewline();
            }
            if (!node.implicitClose) {
                console.assert(node.closeTagName);
                console.assert(node.closeTagPos);
                this._builder.appendToken("</" + node.closeTagName + ">", node.closeTagPos);
            }
            this._builder.appendNewline();
            return;
        }

        if (node.type === HTMLTreeBuilderFormatter.NodeType.Text)
            return;

        if (node.type === HTMLTreeBuilderFormatter.NodeType.Comment) {
            let closingCommentString = node.opener ? ">" : "-->";
            this._builder.appendToken(closingCommentString, node.closePos);
            this._builder.appendNewline();
            return;
        }

        if (node.type === HTMLTreeBuilderFormatter.NodeType.Doctype) {
            let closingDoctypeString = ">";
            this._builder.appendToken(closingDoctypeString, node.closePos);
            this._builder.appendNewline();
            return;
        }

        if (node.type === HTMLTreeBuilderFormatter.NodeType.CData) {
            let closingCDataString = "]]>";
            this._builder.appendToken(closingCDataString, node.closePos);
            return;
        }

        if (node.type === HTMLTreeBuilderFormatter.NodeType.Error)
            return;

        console.assert(false, "Unhandled node type", node.type, node);
    }

    _formatWithNestedFormatter(sourceText, parentNode, textNode, formatterCallback)
    {
        this._builder.appendNewline();

        let originalIndentLevel = this._builder.indentLevel;
        this._builder.originalOffset = textNode.pos;

        let formatter = formatterCallback();
        if (!formatter.success) {
            this._builder.removeLastNewline();
            this._builder.originalOffset = 0;
            return false;
        }

        this._builder.appendMapping(sourceText.length);
        this._builder.indentToLevel(originalIndentLevel);
        this._builder.originalOffset = 0;

        return true;
    }

    _formatScript(sourceText, scriptNode, textNode)
    {
        // <script type="module">.
        let isModule = false;
        if (scriptNode.attributes) {
            for (let {name, value} of scriptNode.attributes) {
                if (name === "type") {
                    if (value && value.toLowerCase() === "module")
                        isModule = true;
                    break;
                }
            }
        }

        return this._formatWithNestedFormatter(sourceText, scriptNode, textNode, () => {
            let sourceType = isModule ? JSFormatter.SourceType.Module : JSFormatter.SourceType.Script;
            return new JSFormatter(sourceText, sourceType, this._builder);
        });
    }

    _formatStyle(sourceText, styleNode, textNode)
    {
        return this._formatWithNestedFormatter(sourceText, styleNode, textNode, () => {
            return new CSSFormatter(sourceText, this._builder);
        });
    }
};

HTMLFormatter.SourceType = {
    HTML: "html",
    XML: "xml",
};
