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

HTMLParser = class HTMLParser {

    // Public

    parseDocument(sourceText, treeBuilder, {isXML} = {})
    {
        console.assert(typeof sourceText === "string");
        console.assert(treeBuilder);
        console.assert(treeBuilder.pushParserNode);

        this._treeBuilder = treeBuilder;

        this._pos = 0;
        this._mode = HTMLParser.Mode.Data;
        this._data = sourceText;
        this._bogusCommentOpener = null;
        this._isXML = !!isXML;

        if (this._treeBuilder.begin)
            this._treeBuilder.begin();

        while (this._pos < this._data.length)
            this._parse();

        if (this._treeBuilder.end)
            this._treeBuilder.end();
    }

    // Private

    _isEOF()
    {
        return this._pos === this._data.length;
    }

    _peek(n = 1)
    {
        return this._data.substring(this._pos, this._pos + n);
    }

    _peekCharacterRegex(regex)
    {
        return regex.test(this._data.charAt(this._pos));
    }

    _peekString(str)
    {
        for (let i = 0; i < str.length; ++i) {
            let c = str[i];
            if (this._data.charAt(this._pos + i) !== c)
                return false;
        }

        return true;
    }

    _peekCaseInsensitiveString(str)
    {
        console.assert(str.toLowerCase() === str, "String should be passed in as lowercase.");

        for (let i = 0; i < str.length; ++i) {
            let d = this._data.charAt(this._pos + i);
            if (!d)
                return false;
            let c = str[i];
            if (d.toLowerCase() !== c)
                return false;
        }

        return true;
    }

    _consumeRegex(regex)
    {
        let startIndex = this._pos;
        while (regex.test(this._data.charAt(this._pos)))
            this._pos++;

        return this._data.substring(startIndex, this._pos);
    }

    _consumeWhitespace()
    {
        return this._consumeRegex(/\s/);
    }

    _consumeUntilString(str, newMode)
    {
        let index = this._data.indexOf(str, this._pos);
        if (index === -1) {
            let startIndex = this._pos;
            this._pos = this._data.length;
            if (newMode)
                this._mode = newMode;
            return this._data.substring(startIndex, this._data.length);
        }

        let startIndex = this._pos;
        this._pos = index + str.length;
        if (newMode)
            this._mode = newMode;
        return this._data.substring(startIndex, index);
    }

    _consumeDoubleQuotedString()
    {
        console.assert(this._peekString(`"`));
        this._pos++;
        let string = this._consumeUntilString(`"`);
        return string;
    }

    _consumeSingleQuotedString()
    {
        console.assert(this._peekString(`'`));
        this._pos++;
        let string = this._consumeUntilString(`'`);
        return string;
    }

    // Parser
    // This is a crude implementation of HTML tokenization:
    // https://html.spec.whatwg.org/multipage/parsing.html

    _parse()
    {
        switch (this._mode) {
        case HTMLParser.Mode.Data:
            return this._parseData();
        case HTMLParser.Mode.ScriptData:
            return this._parseScriptData();
        case HTMLParser.Mode.TagOpen:
            return this._parseTagOpen();
        case HTMLParser.Mode.Attr:
            return this._parseAttr();
        case HTMLParser.Mode.CData:
            return this._parseCData();
        case HTMLParser.Mode.Doctype:
            return this._parseDoctype();
        case HTMLParser.Mode.Comment:
            return this._parseComment();
        case HTMLParser.Mode.BogusComment:
            return this._parseBogusComment();
        }

        console.assert();
        throw "Missing parser mode";
    }

    _parseData()
    {
        let startPos = this._pos;
        let text = this._consumeUntilString("<", HTMLParser.Mode.TagOpen);
        if (text)
            this._push({type: HTMLParser.NodeType.Text, data: text, pos: startPos});

        if (this._isEOF() && this._data.endsWith("<"))
            this._handleEOF(this._pos - 1);
    }

    _parseScriptData()
    {
        let startPos = this._pos;
        let scriptText = "";

        // Parse as text until </script>.
        while (true) {
            scriptText += this._consumeUntilString("<");
            if (this._peekCaseInsensitiveString("/script>")) {
                this._pos += "/script>".length;
                this._mode = HTMLParser.Mode.Data;
                break;
            }
            if (this._handleEOF(startPos))
                return;
            scriptText += "<";
        }

        if (scriptText)
            this._push({type: HTMLParser.NodeType.Text, data: scriptText, pos: startPos});
        this._push({type: HTMLParser.NodeType.CloseTag, name: "script", pos: startPos + scriptText.length});
    }

    _parseTagOpen()
    {
        // |<tag
        this._currentTagStartPos = this._pos - 1;

        if (this._peekString("!")) {
            // Comment.
            if (this._peekString("!--")) {
                this._pos += "!--".length;
                this._mode = HTMLParser.Mode.Comment;
                this._handleEOF(this._currentTagStartPos);
                return;
            }

            // DOCTYPE.
            if (this._peekCaseInsensitiveString("!doctype")) {
                let startPos = this._pos;
                this._pos += "!DOCTYPE".length;
                this._doctypeRaw = this._data.substring(startPos, this._pos);
                this._mode = HTMLParser.Mode.Doctype;
                this._handleEOF(this._currentTagStartPos);
                return;
            }

            // CDATA.
            if (this._peekString("![CDATA[")) {
                this._pos += "![CDATA[".length;
                this._mode = HTMLParser.Mode.CData;
                this._handleEOF(this._currentTagStartPos);
                return;
            }

            // Bogus Comment.
            this._pos++;
            this._mode = HTMLParser.Mode.BogusComment;
            this._handleEOF(this._currentTagStartPos);
            return;
        }

        if (this._peekString("?")) {
            // Bogus Comment.
            this._pos++;
            this._mode = HTMLParser.Mode.BogusComment;
            this._bogusCommentOpener = "<?";
            this._handleEOF(this._currentTagStartPos);
            return;
        }

        if (this._peekString("/")) {
            // End Tag.
            this._pos++;
            let text = this._consumeUntilString(">", HTMLParser.Mode.Data);
            this._push({type: HTMLParser.NodeType.CloseTag, name: text, pos: this._currentTagStartPos});
            return;
        }

        // ASCII - Open Tag
        if (this._peekCharacterRegex(/[a-z]/i)) {
            let text = this._consumeRegex(/[^\s/>]+/);
            if (text) {
                if (this._peekCharacterRegex(/\s/)) {
                    this._currentTagName = text;
                    this._currentTagAttributes = [];
                    this._mode = HTMLParser.Mode.Attr;
                    return;
                }

                if (this._peekString("/>")) {
                    this._pos += "/>".length;
                    this._mode = HTMLParser.Mode.Data;
                    this._push({type: HTMLParser.NodeType.OpenTag, name: text, closed: true, pos: this._currentTagStartPos});
                    return;
                }

                if (this._peekString(">")) {
                    this._pos++;
                    this._mode = HTMLParser.Mode.Data;
                    this._push({type: HTMLParser.NodeType.OpenTag, name: text, closed: false, pos: this._currentTagStartPos});
                    return;
                }

                // End of document. Output any remaining data as error text.
                console.assert(this._isEOF());
                this._push({type: HTMLParser.NodeType.ErrorText, data: "<" + text, pos: this._currentTagStartPos});
                return;
            }
        }

        // Anything else, treat as text.
        this._push({type: HTMLParser.NodeType.Text, data: "<", pos: this._currentTagStartPos});
        this._mode = HTMLParser.Mode.Data;
    }

    _parseAttr()
    {
        this._consumeWhitespace();

        if (this._peekString("/>")) {
            this._pos += "/>".length;
            this._mode = HTMLParser.Mode.Data;
            this._push({type: HTMLParser.NodeType.OpenTag, name: this._currentTagName, closed: true, attributes: this._currentTagAttributes, pos: this._currentTagStartPos});
            return;
        }

        if (this._peekString(">")) {
            this._pos++;
            this._mode = HTMLParser.Mode.Data;
            this._push({type: HTMLParser.NodeType.OpenTag, name: this._currentTagName, closed: false, attributes: this._currentTagAttributes, pos: this._currentTagStartPos});
            return;
        }

        // <tag |attr
        let attributeNameStartPos = this._pos;

        let attributeName = this._consumeRegex(/[^\s=/>]+/);
        // console.assert(attributeName.length > 0, "Unexpected empty attribute name");
        if (this._peekString("/") || this._peekString(">")) {
            if (attributeName)
                this._pushAttribute({name: attributeName, value: undefined, namePos: attributeNameStartPos});
            return;
        }

        this._consumeWhitespace();

        if (this._peekString("=")) {
            this._pos++;

            // <tag attr=|value
            let attributeValueStartPos = this._pos;

            this._consumeWhitespace();

            if (this._peekString(`"`)) {
                let attributeValue = this._consumeDoubleQuotedString();
                this._pushAttribute({name: attributeName, value: attributeValue, quote: HTMLParser.AttrQuoteType.Double, namePos: attributeNameStartPos, valuePos: attributeValueStartPos});
                return;
            }

            if (this._peekString(`'`)) {
                let attributeValue = this._consumeSingleQuotedString();
                this._pushAttribute({name: attributeName, value: attributeValue, quote: HTMLParser.AttrQuoteType.Single, namePos: attributeNameStartPos, valuePos: attributeValueStartPos});
                return;
            }

            if (this._peekString(">")) {
                this._pos++;
                this._mode = HTMLParser.Mode.Data;
                this._push({type: HTMLParser.NodeType.OpenTag, name: this._currentTagName, closed: false, attributes: this._currentTagAttributes, pos: this._currentTagStartPos});
                return;
            }

            let whitespace = this._consumeWhitespace();
            if (whitespace) {
                this._pushAttribute({name: attributeName, value: undefined, quote: HTMLParser.AttrQuoteType.None, namePos: attributeNameStartPos});
                return;
            }

            let attributeValue = this._consumeRegex(/[^\s=>]+/);
            this._pushAttribute({name: attributeName, value: attributeValue, quote: HTMLParser.AttrQuoteType.None, namePos: attributeNameStartPos, valuePos: attributeValueStartPos});
            return;
        }

        if (!this._isEOF()) {
            this._pushAttribute({name: attributeName, value: undefined, quote: HTMLParser.AttrQuoteType.None, namePos: attributeNameStartPos});
            return;
        }

        // End of document. Treat everything up to now as error text.
        console.assert(this._isEOF());
        this._push({type: HTMLParser.NodeType.ErrorText, data: this._data.substring(this._currentTagStartPos), pos: this._currentTagStartPos});
        return;
    }

    _parseComment()
    {
        let text = this._consumeUntilString("-->", HTMLParser.Mode.Data);
        if (this._isEOF() && !this._data.endsWith("-->")) {
            this._push({type: HTMLParser.NodeType.ErrorText, data: this._data.substring(this._currentTagStartPos), pos: this._currentTagStartPos});
            return;
        }

        let closePos = this._pos - "-->".length;
        this._push({type: HTMLParser.NodeType.Comment, data: text, pos: this._currentTagStartPos, closePos});
    }

    _parseBogusComment()
    {
        let text = this._consumeUntilString(">", HTMLParser.Mode.Data);
        if (this._isEOF() && !this._data.endsWith(">")) {
            this._push({type: HTMLParser.NodeType.ErrorText, data: this._data.substring(this._currentTagStartPos), pos: this._currentTagStartPos});
            return;
        }

        let closePos = this._pos - ">".length;
        this._push({type: HTMLParser.NodeType.Comment, data: text, opener: this._bogusCommentOpener || "", pos: this._currentTagStartPos, closePos});
        this._bogusCommentOpener = null;
    }

    _parseDoctype()
    {
        let text = this._consumeUntilString(">", HTMLParser.Mode.Data);
        if (this._isEOF() && !this._data.endsWith(">")) {
            this._push({type: HTMLParser.NodeType.ErrorText, data: this._data.substring(this._currentTagStartPos), pos: this._currentTagStartPos});
            return;
        }

        let closePos = this._pos - ">".length;
        this._push({type: HTMLParser.NodeType.Doctype, data: text, raw: this._doctypeRaw, pos: this._currentTagStartPos, closePos});
        this._doctypeRaw = null;
    }

    _parseCData()
    {
        let text = this._consumeUntilString("]]>", HTMLParser.Mode.Data);
        if (this._isEOF() && !this._data.endsWith("]]>")) {
            this._push({type: HTMLParser.NodeType.ErrorText, data: this._data.substring(this._currentTagStartPos), pos: this._currentTagStartPos});
            return;
        }

        let closePos = this._pos - "]]>".length;
        this._push({type: HTMLParser.NodeType.CData, data: text, pos: this._currentTagStartPos, closePos});
    }

    _pushAttribute(attr)
    {
        this._currentTagAttributes.push(attr);
        this._handleEOF(this._currentTagStartPos);
    }

    _handleEOF(lastPosition)
    {
        if (!this._isEOF())
            return false;

        // End of document. Treat everything from the last position as error text.
        this._push({type: HTMLParser.NodeType.ErrorText, data: this._data.substring(lastPosition), pos: lastPosition});
        return true;
    }

    _push(node)
    {
        // Custom mode for some elements.
        if (node.type === HTMLParser.NodeType.OpenTag) {
            if (!this._isXML && node.name.toLowerCase() === "script")
                this._mode = HTMLParser.Mode.ScriptData;
        }

        this._treeBuilder.pushParserNode(node);
    }
};

HTMLParser.Mode = {
    Data: "data",
    TagOpen: "tag-open",
    ScriptData: "script-data",
    Attr: "attr",
    CData: "cdata",
    Doctype: "doctype",
    Comment: "comment",
    BogusComment: "bogus-comment",
};

HTMLParser.NodeType = {
    Text: "text",
    ErrorText: "error-text",
    OpenTag: "open-tag",
    CloseTag: "close-tag",
    Comment: "comment",
    Doctype: "doctype",
    CData: "cdata",
};

HTMLParser.AttrQuoteType = {
    None: "none",
    Double: "double",
    Single: "single",
};
