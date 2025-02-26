/*
 * Copyright (C) 2014, 2015 Apple Inc. All rights reserved.
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

WI.TypeTokenAnnotator = class TypeTokenAnnotator extends WI.Annotator
{
    constructor(sourceCodeTextEditor, script)
    {
        super(sourceCodeTextEditor);

        this._script = script;
        this._typeTokenNodes = [];
        this._typeTokenBookmarks = [];
    }

    // Protected

    insertAnnotations()
    {
        if (!this.isActive())
            return;

        var scriptSyntaxTree = this._script.scriptSyntaxTree;

        if (!scriptSyntaxTree) {
            this._script.requestScriptSyntaxTree((syntaxTree) => {
                // After requesting the tree, we still might get a null tree from a parse error.
                if (syntaxTree)
                    this.insertAnnotations();
            });
            return;
        }

        if (!scriptSyntaxTree.parsedSuccessfully)
            return;

        let {startPosition, endPosition} = this.sourceCodeTextEditor.visibleRangePositions();

        let startTime = Date.now();
        let allNodesInRange = scriptSyntaxTree.filterByRange(startPosition, endPosition);
        scriptSyntaxTree.updateTypes(allNodesInRange, (nodesWithUpdatedTypes) => {
            // Because this is an asynchronous call, we could have been deactivated before the callback function is called.
            if (!this.isActive())
                return;

            nodesWithUpdatedTypes.forEach(this._insertTypeToken, this);

            let totalTime = Date.now() - startTime;
            let timeoutTime = Number.constrain(8 * totalTime, 500, 2000);
            this._timeoutIdentifier = setTimeout(() => {
                this._timeoutIdentifier = null;
                this.insertAnnotations();
            }, timeoutTime);
        });
    }

    clearAnnotations()
    {
        this._clearTypeTokens();
    }

    // Private

    _insertTypeToken(node)
    {
        if (node.type === WI.ScriptSyntaxTree.NodeType.Identifier) {
            if (!node.attachments.__typeToken && node.attachments.types && node.attachments.types.valid)
                this._insertToken(node, false, WI.TypeTokenView.TitleType.Variable, node.name);

            if (node.attachments.__typeToken)
                node.attachments.__typeToken.update(node.attachments.types);

            return;
        }

        console.assert(node.type === WI.ScriptSyntaxTree.NodeType.FunctionDeclaration || node.type === WI.ScriptSyntaxTree.NodeType.FunctionExpression || node.type === WI.ScriptSyntaxTree.NodeType.ArrowFunctionExpression);

        var functionReturnType = node.attachments.returnTypes;
        if (!functionReturnType || !functionReturnType.valid)
            return;

        // If a function does not have an explicit return statement with an argument (i.e, "return x;" instead of "return;")
        // then don't show a return type unless we think it's a constructor.
        var scriptSyntaxTree = this._script._scriptSyntaxTree;
        if (!node.attachments.__typeToken && (scriptSyntaxTree.containsNonEmptyReturnStatement(node.body) || !functionReturnType.typeSet.isContainedIn(WI.TypeSet.TypeBit.Undefined))) {
            var functionName = node.id ? node.id.name : null;
            this._insertToken(node, true, WI.TypeTokenView.TitleType.ReturnStatement, functionName);
        }

        if (node.attachments.__typeToken)
            node.attachments.__typeToken.update(node.attachments.returnTypes);
    }

    _insertToken(node, shouldTranslateOffsetToAfterParameterList, typeTokenTitleType, functionOrVariableName)
    {
        let tokenPosition = this.sourceCodeTextEditor.originalPositionToCurrentPosition(node.startPosition);
        let currentOffset = this.sourceCodeTextEditor.currentPositionToCurrentOffset(tokenPosition);
        let sourceString = this.sourceCodeTextEditor.string;

        if (shouldTranslateOffsetToAfterParameterList) {
            // Translate the position to the closing parenthesis of the function arguments:
            // translate from: [type-token] function foo() {} => to: function foo() [type-token] {}
            currentOffset = this._translateToOffsetAfterFunctionParameterList(node, currentOffset, sourceString);
            tokenPosition = this.sourceCodeTextEditor.currentOffsetToCurrentPosition(currentOffset);
        }

        // Note: bookmarks render to the left of the character they're being displayed next to.
        // This is why right margin checks the current offset. And this is okay to do because JavaScript can't be written right-to-left.
        var isSpaceRegexp = /\s/;
        var shouldHaveLeftMargin = currentOffset !== 0 && !isSpaceRegexp.test(sourceString[currentOffset - 1]);
        var shouldHaveRightMargin = !isSpaceRegexp.test(sourceString[currentOffset]);
        var typeToken = new WI.TypeTokenView(this, shouldHaveRightMargin, shouldHaveLeftMargin, typeTokenTitleType, functionOrVariableName);
        var bookmark = this.sourceCodeTextEditor.setInlineWidget(tokenPosition, typeToken.element);
        node.attachments.__typeToken = typeToken;
        this._typeTokenNodes.push(node);
        this._typeTokenBookmarks.push(bookmark);
    }

    _translateToOffsetAfterFunctionParameterList(node, offset, sourceString)
    {
        // The assumption here is that we get the offset starting at the function keyword (or after the get/set keywords).
        // We will return the offset for the closing parenthesis in the function declaration.
        // All this code is just a way to find this parenthesis while ignoring comments.

        var isMultiLineComment = false;
        var isSingleLineComment = false;
        var shouldIgnore = false;
        const isArrowFunction = node.type === WI.ScriptSyntaxTree.NodeType.ArrowFunctionExpression;

        function isLineTerminator(char)
        {
            // Reference EcmaScript 5 grammar for single line comments and line terminators:
            // http://www.ecma-international.org/ecma-262/5.1/#sec-7.3
            // http://www.ecma-international.org/ecma-262/5.1/#sec-7.4
            return char === "\n" || char === "\r" || char === "\u2028" || char === "\u2029";
        }

        while (((!isArrowFunction && sourceString[offset] !== ")")
                || (isArrowFunction && sourceString[offset] !== ">")
                || shouldIgnore)
               && offset < sourceString.length) {
            if (isSingleLineComment && isLineTerminator(sourceString[offset])) {
                isSingleLineComment = false;
                shouldIgnore = false;
            } else if (isMultiLineComment && sourceString[offset] === "*" && sourceString[offset + 1] === "/") {
                isMultiLineComment = false;
                shouldIgnore = false;
                offset++;
            } else if (!shouldIgnore && sourceString[offset] === "/") {
                offset++;
                if (sourceString[offset] === "*")
                    isMultiLineComment = true;
                else if (sourceString[offset] === "/")
                    isSingleLineComment = true;
                else
                    throw new Error("Bad parsing. Couldn't parse comment preamble.");
                shouldIgnore = true;
            }

            offset++;
        }

        return offset + 1;
    }

    _clearTypeTokens()
    {
        this._typeTokenNodes.forEach(function(node) {
            node.attachments.__typeToken = null;
        });
        this._typeTokenBookmarks.forEach(function(bookmark) {
            bookmark.clear();
        });

        this._typeTokenNodes = [];
        this._typeTokenBookmarks = [];
    }
};
