/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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

// There is no standard for tokenizer types in JavaScript ASTs.
// This currently assumes Esprima tokens, ranges, and comments.
// <http://esprima.org/demo/parse.html>

JSFormatter = class JSFormatter
{
    constructor(sourceText, sourceType, builder, indentString = "    ")
    {
        this._success = false;

        let tree = (function() {
            try {
                return esprima.parse(sourceText, {attachComment: true, range: true, tokens: true, sourceType});
            } catch(error) {
                console.error(`Failed to parse source text of type "${sourceType}".`, error);
                return null;
            }
        })();

        if (!tree)
            return;

        this._sourceText = sourceText;

        this._tokens = tree.tokens;
        this._tokensLength = this._tokens.length;
        this._tokenIndex = 0;

        this._lineEndings = sourceText.lineEndings();
        this._lineEndingsIndex = 0;

        this._builder = builder;
        if (!this._builder) {
            this._builder = new FormatterContentBuilder(indentString);
            this._builder.setOriginalLineEndings(this._lineEndings.slice());
        }

        let walker = new ESTreeWalker(this._before.bind(this), this._after.bind(this));
        walker.walk(tree);
        this._afterProgram(tree);
        this._builder.appendNewline();

        this._success = true;
    }

    // Static

    static isWhitespace(ch)
    {
        return isECMAScriptWhitespace(ch) || isECMAScriptLineTerminator(ch);
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

    _appendNewline(node, force)
    {
        if (!force && node.type !== "TemplateElement") {
            while (node = node.parent) {
                if (node.type === "TemplateLiteral")
                    return;
            }
        }

        this._builder.appendNewline(force);
    }

    _insertNewlinesBeforeToken(node, token)
    {
        let force = false;
        while (token.range[0] > this._lineEndings[this._lineEndingsIndex]) {
            this._appendNewline(node, force);
            this._lineEndingsIndex++;
            force = true;
        }
    }

    _insertComment(node, comment)
    {
        if (comment.type === "Line")
            this._builder.appendToken("//" + comment.value, comment.range[0]);
        else if (comment.type === "Block")
            this._builder.appendStringWithPossibleNewlines("/*" + comment.value + "*/", comment.range[0]);
        this._appendNewline(node);
        comment.__handled = true;
    }

    _insertSameLineTrailingComments(node)
    {
        let endOfLine = this._lineEndings[this._lineEndingsIndex];
        for (let comment of node.trailingComments) {
            if (comment.range[0] > endOfLine)
                break;
            this._builder.removeLastNewline();
            this._builder.appendSpace();
            this._insertComment(node, comment);
        }
    }

    _insertCommentsAndNewlines(node, comments)
    {
        for (let comment of comments) {
            // A previous node may have handled this as a trailing comment.
            if (comment.__handled)
                continue;

            // We expect the comment to be ahead of the last line.
            // But if it is ahead of the next line ending, then it
            // was preceded by an empty line. So include that.
            if (comment.range[0] > this._lineEndings[this._lineEndingsIndex + 1])
                this._builder.appendNewline(true);

            this._insertComment(node, comment);

            // Remove line endings for this comment.
            while (comment.range[1] > this._lineEndings[this._lineEndingsIndex])
                this._lineEndingsIndex++;
        }
    }

    _before(node)
    {
        if (!node.parent || !node.range)
            return;

        // Handle the tokens before this node, so in the context of our parent node.
        while (this._tokenIndex < this._tokensLength && this._tokens[this._tokenIndex].range[0] < node.range[0]) {
            let token = this._tokens[this._tokenIndex++];
            this._insertNewlinesBeforeToken(node, token);
            this._handleTokenAtNode(token, node.parent);
        }

        if (node.leadingComments)
            this._insertCommentsAndNewlines(node, node.leadingComments);
    }

    _after(node)
    {
        if (!node.range)
            return;

        // Handle any other tokens inside of this node before exiting.
        while (this._tokenIndex < this._tokensLength && this._tokens[this._tokenIndex].range[0] < node.range[1]) {
            let token = this._tokens[this._tokenIndex++];
            this._insertNewlinesBeforeToken(node, token);
            this._handleTokenAtNode(token, node);
        }

        this._exitNode(node);

        if (node.trailingComments)
            this._insertSameLineTrailingComments(node);
    }

    _isInForHeader(node)
    {
        let parent = node.parent;
        if (!parent)
            return false;

        return (parent.type === "ForStatement" || parent.type === "ForInStatement" || parent.type === "ForOfStatement") && node !== parent.body;
    }

    _isRangeWhitespace(from, to)
    {
        let substring = this._sourceText.substring(from, to);
        for (let i = 0; i < substring.length; ++i) {
            if (!JSFormatter.isWhitespace(substring.charCodeAt(i)))
                return false;
        }

        return true;
    }

    _handleTokenAtNode(token, node)
    {
        let builder = this._builder;
        let nodeType = node.type;
        let tokenType = token.type;
        let tokenValue = token.value;
        let tokenOffset = token.range[0];

        // Very common types that just pass through.
        if (nodeType === "MemberExpression" || nodeType === "Literal" || nodeType === "ThisExpression" || nodeType === "UpdateExpression") {
            builder.appendToken(tokenValue, tokenOffset);
            return;
        }

        // Most identifiers just pass through, but a few are special.
        if (nodeType === "Identifier" || nodeType === "PrivateIdentifier") {
            builder.appendToken(tokenValue, tokenOffset);
            if (tokenValue === "async" && node.parent.type === "Property" && node.parent.value.async && token.range[1] !== node.range[1])
                builder.appendSpace();
            return;
        }

        // Most newline handling is done with semicolons. However, we preserve
        // newlines so code relying on automatic semicolon insertion should
        // continue to work.
        if (tokenValue === ";") {
            // Avoid newlines for for loop header semicolons.
            if (nodeType === "ForStatement") {
                builder.appendToken(tokenValue, tokenOffset);
                // Do not include spaces in empty for loop header sections: for(;;)
                if (node.test || node.update) {
                    if (node.test && this._isRangeWhitespace(token.range[1], node.test.range[0]))
                        builder.appendSpace();
                    else if (node.update && this._isRangeWhitespace(token.range[1], node.update.range[0]))
                        builder.appendSpace();
                }
                return;
            }

            // Sometimes more specific nodes gets the semicolon inside a for loop header.
            // Avoid newlines. Example is a VariableDeclaration in: for (var a, b; ...; ...).
            if (this._isInForHeader(node)) {
                builder.appendToken(tokenValue, tokenOffset);
                builder.appendSpace();
                return;
            }

            // Avoid newline for single statement arrow functions with semicolons.
            if (node.parent.type === "BlockStatement" && node.parent.body.length === 1 && node.parent.parent && node.parent.parent.type === "ArrowFunctionExpression") {
                builder.appendToken(tokenValue, tokenOffset);
                return;
            }

            builder.appendToken(tokenValue, tokenOffset);
            this._appendNewline(node);
            return;
        }

        if (nodeType === "CallExpression" || nodeType === "ArrayExpression" || nodeType === "ArrayPattern" || nodeType === "ObjectPattern") {
            if (tokenValue === ",") {
                builder.appendToken(tokenValue, tokenOffset);
                builder.appendSpace();
                return;
            }
            builder.appendToken(tokenValue, tokenOffset);
            return;
        }

        if (nodeType === "SequenceExpression") {
            builder.appendToken(tokenValue, tokenOffset);
            if (tokenValue === ",") {
                if (node.parent.type === "ExpressionStatement")
                    this._appendNewline(node);
                else
                    builder.appendSpace();
            }
            return;
        }

        if (nodeType === "LogicalExpression" || nodeType === "BinaryExpression") {
            if (tokenValue !== "(" && tokenValue !== ")") {
                builder.appendSpace();
                builder.appendToken(tokenValue, tokenOffset);
                builder.appendSpace();
                return;
            }
            if (tokenType === "Keyword") {
                // in, instanceof, ...
                builder.appendSpace();
                builder.appendToken(tokenValue, tokenOffset);
                builder.appendSpace();
                return;
            }
            builder.appendToken(tokenValue, tokenOffset);
            return;
        }

        if (nodeType === "BlockStatement" || node.type === "StaticBlock") {
            if (tokenValue === "{") {
                // Class methods we put the opening brace on its own line.
                if (node.parent && node.parent.parent && node.parent.parent.type === "MethodDefinition" && node.body.length) {
                    this._appendNewline(node);
                    builder.appendToken(tokenValue, tokenOffset);
                    this._appendNewline(node);
                    builder.indent();
                    return;
                }
                builder.appendToken(tokenValue, tokenOffset);
                if (node.body.length)
                    this._appendNewline(node);
                builder.indent();
                return;
            }
            if (tokenValue === "}") {
                if (node.body.length)
                    this._appendNewline(node);
                builder.dedent();
                builder.appendToken(tokenValue, tokenOffset);
                return;
            }
            console.warn("Unexpected BlockStatement or StaticBlock token", token);
            builder.appendToken(tokenValue, tokenOffset);
            return;
        }

        if (nodeType === "VariableDeclaration") {
            if (tokenValue === ",") {
                if (this._isInForHeader(node)) {
                    builder.appendToken(tokenValue, tokenOffset);
                    builder.appendSpace();
                    return;
                }
                builder.appendToken(tokenValue, tokenOffset);
                this._appendNewline(node);
                return;
            }
            builder.appendToken(tokenValue, tokenOffset);
            builder.appendSpace();
            // If this is a multiple variable declaration, indent.
            if (node.declarations.length > 1 && !node.__autoDedent) {
                builder.indent();
                node.__autoDedent = true;
            }
            return;
        }

        if (nodeType === "VariableDeclarator" || nodeType === "AssignmentExpression") {
            if (tokenType === "Punctuator") {
                let surroundWithSpaces = tokenValue !== "(" && tokenValue !== ")";
                if (surroundWithSpaces)
                    builder.appendSpace();
                builder.appendToken(tokenValue, tokenOffset);
                if (surroundWithSpaces)
                    builder.appendSpace();
                return;
            }
            console.warn("Unexpected " + nodeType + " token", token);
            builder.appendToken(tokenValue, tokenOffset);
            return;
        }

        if (nodeType === "IfStatement") {
            if (tokenType === "Keyword") {
                if (tokenValue === "else") {
                    if (node.__autoDedent) {
                        builder.dedent();
                        node.__autoDedent = false;
                    }
                    builder.appendSpace();
                    builder.appendToken(tokenValue, tokenOffset);

                    if (node.alternate && (node.alternate.type !== "BlockStatement" && node.alternate.type !== "IfStatement")) {
                        this._appendNewline(node);
                        builder.indent();
                        node.__autoDedent = true;
                    } else
                        builder.appendSpace();
                    return;
                }

                console.assert(tokenValue === "if", token);
                builder.appendToken(tokenValue, tokenOffset);
                builder.appendSpace();
                return;
            }

            // The last ')' in if(){}.
            if (tokenValue === ")" && this._isRangeWhitespace(token.range[1], node.consequent.range[0])) {
                if (node.consequent.type === "BlockStatement") {
                    // The block will handle indenting.
                    builder.appendToken(tokenValue, tokenOffset);
                    builder.appendSpace();
                    return;
                }

                builder.appendToken(tokenValue, tokenOffset);
                this._appendNewline(node);
                builder.indent();
                node.__autoDedent = true;
                return;
            }

            builder.appendToken(tokenValue, tokenOffset);
            return;
        }

        if (nodeType === "ReturnStatement") {
            if (tokenValue === ";") {
                builder.appendToken(tokenValue, tokenOffset);
                return;
            }
            builder.appendToken(tokenValue, tokenOffset);
            if (node.argument) {
                // Multi-line LogicalExpressions (&& and ||) are a common style of return
                // statement that benefits from indentation.
                if (node.argument.type === "LogicalExpression" && !node.__autoDedent) {
                    builder.indent();
                    node.__autoDedent = true;
                }
                builder.appendSpace();
            }
            return;
        }

        if (nodeType === "FunctionDeclaration" || nodeType === "FunctionExpression") {
            if (tokenType === "Keyword") {
                console.assert(tokenValue === "function", token);
                builder.appendToken(tokenValue, tokenOffset);
                if (node.id)
                    builder.appendSpace();
                return;
            }
            if (tokenType === "Punctuator") {
                if (tokenValue === "*") {
                    builder.tryRemoveLastWhitespace();
                    builder.appendToken(tokenValue, tokenOffset);
                    builder.appendSpace();
                    return;
                }
                builder.appendToken(tokenValue, tokenOffset);
                if (tokenValue === ")" || tokenValue === ",")
                    builder.appendSpace();
                return;
            }
            if (tokenType === "Identifier" && tokenValue === "async") {
                builder.appendToken(tokenValue, tokenOffset);
                builder.appendSpace();
                return;
            }
            builder.appendToken(tokenValue, tokenOffset);
            return;
        }

        if (nodeType === "WhileStatement" || nodeType === "WithStatement") {
            if (tokenValue === "while" || tokenValue === "with") {
                builder.appendToken(tokenValue, tokenOffset);
                builder.appendSpace();
                return;
            }

            // The last ')' in while(){} or with(){}.
            if (tokenValue === ")" && this._isRangeWhitespace(token.range[1], node.body.range[0])) {
                if (node.body.type === "BlockStatement") {
                    // The block will handle indenting.
                    builder.appendToken(tokenValue, tokenOffset);
                    builder.appendSpace();
                    return;
                }

                builder.appendToken(tokenValue, tokenOffset);
                this._appendNewline(node);
                builder.indent();
                node.__autoDedent = true;
                return;
            }

            builder.appendToken(tokenValue, tokenOffset);
            return;
        }

        if (nodeType === "ForStatement" || nodeType === "ForOfStatement" || nodeType === "ForInStatement") {
            if (tokenValue === "for" || tokenValue === "await") {
                builder.appendToken(tokenValue, tokenOffset);
                builder.appendSpace();
                return;
            }
            if (tokenValue === "in" || tokenValue === "of") {
                builder.appendSpace();
                builder.appendToken(tokenValue, tokenOffset);
                builder.appendSpace();
                return;
            }

            // The last ')' in for(){}.
            if (tokenValue === ")" && this._isRangeWhitespace(token.range[1], node.body.range[0])) {
                if (node.body.type === "BlockStatement") {
                    // The block will handle indenting.
                    builder.appendToken(tokenValue, tokenOffset);
                    builder.appendSpace();
                    return;
                }

                builder.appendToken(tokenValue, tokenOffset);
                this._appendNewline(node);
                builder.indent();
                node.__autoDedent = true;
                return;
            }

            builder.appendToken(tokenValue, tokenOffset);
            return;
        }

        if (nodeType === "SwitchStatement") {
            if (tokenValue === "switch") {
                builder.appendToken(tokenValue, tokenOffset);
                builder.appendSpace();
                return;
            }
            if (tokenType === "Punctuator") {
                if (tokenValue === ")") {
                    // FIXME: Would be nice to only add a space if this the ')' closing the discriminant: switch((1)){}
                    builder.appendToken(tokenValue, tokenOffset);
                    builder.appendSpace();
                    return;
                }
                if (tokenValue === "{") {
                    builder.appendToken(tokenValue, tokenOffset);
                    this._appendNewline(node);
                    return;
                }
                if (tokenValue === "}") {
                    this._appendNewline(node);
                    builder.appendToken(tokenValue, tokenOffset);
                    this._appendNewline(node);
                    return;
                }
            }
            builder.appendToken(tokenValue, tokenOffset);
            return;
        }

        if (nodeType === "SwitchCase") {
            if (tokenType === "Keyword") {
                if (tokenValue === "case") {
                    builder.appendToken(tokenValue, tokenOffset);
                    builder.appendSpace();
                    return;
                }
                if (tokenValue === "default") {
                    builder.appendToken(tokenValue, tokenOffset);
                    return;
                }
                console.warn("Unexpected SwitchCase Keyword token", token);
                builder.appendToken(tokenValue, tokenOffset);
                return;
            }

            if (tokenValue === ":") {
                builder.appendToken(tokenValue, tokenOffset);
                this._appendNewline(node);
                if (node.consequent.length) {
                    builder.indent();
                    node.__autoDedent = true;
                }
                return;
            }

            builder.appendToken(tokenValue, tokenOffset);
            return;
        }

        if (nodeType === "NewExpression") {
            if (tokenValue === "new") {
                builder.appendToken(tokenValue, tokenOffset);
                builder.appendSpace();
                return;
            }
            if (tokenValue === ",") {
                builder.appendToken(tokenValue, tokenOffset);
                builder.appendSpace();
                return;
            }
            builder.appendToken(tokenValue, tokenOffset);
            return;
        }

        if (nodeType === "DoWhileStatement") {
            if (tokenValue === "do") {
                builder.appendToken(tokenValue, tokenOffset);
                builder.appendSpace();
                return;
            }
            if (tokenValue === "while") {
                builder.appendSpace();
                builder.appendToken(tokenValue, tokenOffset);
                builder.appendSpace();
                return;
            }

            builder.appendToken(tokenValue, tokenOffset);
            return;
        }

        if (nodeType === "ThrowStatement") {
            if (tokenValue === "throw") {
                builder.appendToken(tokenValue, tokenOffset);
                builder.appendSpace();
                return;
            }
            builder.appendToken(tokenValue, tokenOffset);
            return;
        }

        if (nodeType === "UnaryExpression") {
            if (tokenType === "Keyword") {
                // typeof, instanceof, void
                builder.appendToken(tokenValue, tokenOffset);
                builder.appendSpace();
                return;
            }
            builder.appendToken(tokenValue, tokenOffset);
            return;
        }

        if (nodeType === "ConditionalExpression") {
            if (tokenValue === "?" || tokenValue === ":") {
                builder.appendSpace();
                builder.appendToken(tokenValue, tokenOffset);
                builder.appendSpace();
                return;
            }
            builder.appendToken(tokenValue, tokenOffset);
            return;
        }

        if (nodeType === "ObjectExpression") {
            // FIXME: It would be nice to detect if node.properties is very short
            // and the node.properties themselves are very small then inline them
            // instead of always adding newlines. Objects like: {a}, {a:1} but
            // not objects like {a:function(){1;}}.
            if (tokenValue === "{") {
                builder.appendToken(tokenValue, tokenOffset);
                if (node.properties.length) {
                    this._appendNewline(node);
                    builder.indent();
                }
                return;
            }
            if (tokenValue === "}") {
                if (node.properties.length) {
                    this._appendNewline(node);
                    builder.dedent();
                }
                builder.appendToken(tokenValue, tokenOffset);
                return;
            }
            if (tokenValue === ",") {
                builder.appendToken(tokenValue, tokenOffset);
                if (node.properties.length)
                    this._appendNewline(node);
                else
                    builder.appendSpace();
                return;
            }
            builder.appendToken(tokenValue, tokenOffset);
            return;
        }

        if (nodeType === "ArrowFunctionExpression") {
            if (tokenType === "Punctuator") {
                if (tokenValue === "=>") {
                    builder.appendSpace();
                    builder.appendToken(tokenValue, tokenOffset);
                    builder.appendSpace();
                    return;
                }
                if (tokenValue === ",") {
                    builder.appendToken(tokenValue, tokenOffset);
                    builder.appendSpace();
                    return;
                }
            }
            builder.appendToken(tokenValue, tokenOffset);
            if (tokenType === "Identifier" && tokenValue === "async")
                builder.appendSpace();
            return;
        }

        if (nodeType === "AwaitExpression") {
            builder.appendToken(tokenValue, tokenOffset);
            if (tokenType === "Identifier" && tokenValue === "await")
                builder.appendSpace();
            return;
        }

        if (nodeType === "Property") {
            const tokenValuesRequiringTrailingWhitespace = [":", "static", "get", "set", "async", "="];
            console.assert([...tokenValuesRequiringTrailingWhitespace, "*", "[", "]", "(", ")", "#"].includes(tokenValue), token);
            if (tokenValue === "=")
                builder.appendSpace();

            builder.appendToken(tokenValue, tokenOffset);

            if (tokenValuesRequiringTrailingWhitespace.includes(tokenValue))
                builder.appendSpace();
            return;
        }

        if (nodeType === "MethodDefinition") {
            const tokenValuesRequiringTrailingWhitespace = ["static", "get", "set", "async"];
            console.assert([...tokenValuesRequiringTrailingWhitespace, "*", "[", "]", "(", ")", "#"].includes(tokenValue), token);
            builder.appendToken(tokenValue, tokenOffset);
            if (tokenValuesRequiringTrailingWhitespace.includes(tokenValue))
                builder.appendSpace();
            return;
        }

        if (nodeType === "BreakStatement" || nodeType === "ContinueStatement") {
            builder.appendToken(tokenValue, tokenOffset);
            if (tokenType === "Keyword" && node.label)
                builder.appendSpace();
            return;
        }

        if (nodeType === "LabeledStatement") {
            console.assert(tokenValue === ":", token);
            builder.appendToken(tokenValue, tokenOffset);
            builder.appendNewline();
            return;
        }

        if (nodeType === "TryStatement") {
            if (tokenValue === "try") {
                builder.appendToken(tokenValue, tokenOffset);
                builder.appendSpace();
                return;
            }
            if (tokenValue === "finally") {
                builder.appendSpace();
                builder.appendToken(tokenValue, tokenOffset);
                builder.appendSpace();
                return;
            }
            console.warn("Unexpected TryStatement token", token);
            builder.appendToken(tokenValue, tokenOffset);
            return;
        }

        if (nodeType === "CatchClause") {
            if (tokenValue === "catch") {
                builder.appendSpace();
                builder.appendToken(tokenValue, tokenOffset);
                builder.appendSpace();
                return;
            }
            if (tokenValue === ")") {
                // The block will handle indenting.
                builder.appendToken(tokenValue, tokenOffset);
                builder.appendSpace();
                return;
            }
            builder.appendToken(tokenValue, tokenOffset);
            return;
        }

        if (nodeType === "ClassExpression" || nodeType === "ClassDeclaration") {
            if (tokenValue === "class") {
                builder.appendToken(tokenValue, tokenOffset);
                builder.appendSpace();
                return;
            }
            if (tokenValue === "extends") {
                builder.appendSpace();
                builder.appendToken(tokenValue, tokenOffset);
                builder.appendSpace();
                return;
            }
            builder.appendToken(tokenValue, tokenOffset);
            return;
        }

        if (nodeType === "ClassBody") {
            if (tokenValue === "{") {
                if (node.parent.id)
                    builder.appendSpace();
                builder.appendToken(tokenValue, tokenOffset);
                if (node.body.length)
                    builder.appendNewline();
                builder.indent();
                return;
            }
            if (tokenValue === "}") {
                if (node.body.length)
                    builder.appendNewline();
                builder.dedent();
                builder.appendToken(tokenValue, tokenOffset);
                builder.appendNewline();
                return;
            }
            console.warn("Unexpected ClassBody token", token);
            builder.appendToken(tokenValue, tokenOffset);
            return;
        }

        if (nodeType === "YieldExpression") {
            if (tokenType === "Keyword") {
                console.assert(tokenValue === "yield", token);
                builder.appendToken(tokenValue, tokenOffset);
                if (node.argument)
                    builder.appendSpace();
                return;
            }
            builder.appendToken(tokenValue, tokenOffset);
            return;
        }

        if (nodeType === "ImportDeclaration" || nodeType === "ExportNamedDeclaration") {
            if (tokenValue === "}" || (tokenType === "Identifier" && (tokenValue === "from" || tokenValue === "assert")))
                builder.appendSpace();
            builder.appendToken(tokenValue, tokenOffset);
            if (tokenValue !== "}")
                builder.appendSpace();
            return;
        }

        if (nodeType === "ExportSpecifier" || nodeType === "ImportSpecifier") {
            if (tokenType === "Identifier" && (tokenValue === "as" || tokenValue === "assert"))
                builder.appendSpace();
            builder.appendToken(tokenValue, tokenOffset);
            builder.appendSpace();
            return;
        }

        if (nodeType === "ExportAllDeclaration" || nodeType === "ExportDefaultDeclaration" || nodeType === "ImportDefaultSpecifier" || nodeType === "ImportNamespaceSpecifier") {
            if (tokenValue === "}" || (tokenType === "Identifier" && tokenValue === "assert"))
                builder.appendSpace();
            builder.appendToken(tokenValue, tokenOffset);
            if (tokenValue !== "(" && tokenValue !== ")" && tokenValue !== "}")
                builder.appendSpace();
            return;
        }

        // Include these here so we get only get warnings about unhandled nodes.
        if (nodeType === "ExpressionStatement"
            || nodeType === "SpreadElement"
            || nodeType === "ImportAttribute"
            || nodeType === "ImportExpression"
            || nodeType === "Super"
            || nodeType === "MetaProperty"
            || nodeType === "RestElement"
            || nodeType === "TemplateElement"
            || nodeType === "TemplateLiteral"
            || nodeType === "DebuggerStatement"
            || nodeType === "AssignmentPattern"
            || nodeType === "ChainExpression") {
            builder.appendToken(tokenValue, tokenOffset);
            return;
        }

        // Warn about possible unhandled types.
        console.warn(nodeType, tokenValue);

        // Fallback behavior in case there are unhandled types.
        builder.appendToken(tokenValue, tokenOffset);

        if (tokenType === "Keyword")
            builder.appendSpace();
    }

    _exitNode(node)
    {
        if (node.__autoDedent)
            this._builder.dedent();

        if (node.type === "BlockStatement" || node.type === "StaticBlock") {
            if (node.parent) {
                // Newline after if(){}
                if (node.parent.type === "IfStatement" && (!node.parent.alternate || node.parent.consequent !== node)) {
                    this._appendNewline(node);
                    return;
                }
                // Newline after for(){}
                if (node.parent.type === "ForStatement" || node.parent.type === "ForOfStatement" || node.parent.type === "ForInStatement") {
                    this._appendNewline(node);
                    return;
                }
                // Newline after while(){}
                if (node.parent.type === "WhileStatement") {
                    this._appendNewline(node);
                    return;
                }
                // Newline after function(){}
                if (node.parent.type === "FunctionDeclaration") {
                    this._appendNewline(node);
                    return;
                }
                // Newline after catch block in try{}catch(e){}
                if (node.parent.type === "CatchClause" && !node.parent.parent.finalizer) {
                    this._appendNewline(node);
                    return;
                }
                // Newline after finally block in try{}catch(e){}finally{}
                if (node.parent.type === "TryStatement" && node.parent.finalizer && node.parent.finalizer === node) {
                    this._appendNewline(node);
                    return;
                }
                // Newline after class body methods in class {method(){}}
                if (node.parent.parent && node.parent.parent.type === "MethodDefinition") {
                    this._appendNewline(node);
                    return;
                }
                // Newline after anonymous block inside a block or program.
                if (node.parent.type === "BlockStatement" || node.parent.type === "StaticBlock" || node.parent.type === "Program") {
                    this._appendNewline(node);
                    return;
                }
            }
            return;
        }
    }

    _afterProgram(programNode)
    {
        if (!programNode)
            return;

        console.assert(programNode.type === "Program");

        // If a program ends with comments, Esprima puts those
        // comments on the last node of the body. However, if
        // a program is entirely comments, then they are
        // leadingComments on the program node.

        if (programNode.body.length) {
            let lastNode = programNode.body[programNode.body.length - 1];
            if (lastNode.trailingComments)
                this._insertCommentsAndNewlines(lastNode, lastNode.trailingComments);
        } else {
            if (programNode.leadingComments)
                this._insertCommentsAndNewlines(programNode, programNode.leadingComments);
            console.assert(!programNode.trailingComments);
        }
    }
};

JSFormatter.SourceType = {
    Script: "script",
    Module: "module",
};
