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

WI.BreakpointLogMessageLexer = class BreakpointLogMessageLexer extends WI.Object
{
    constructor()
    {
        super();

        this._stateFunctions = {
            [WI.BreakpointLogMessageLexer.State.Expression]: this._expression,
            [WI.BreakpointLogMessageLexer.State.PlainText]: this._plainText,
            [WI.BreakpointLogMessageLexer.State.PossiblePlaceholder]: this._possiblePlaceholder,
            [WI.BreakpointLogMessageLexer.State.RegExpOrStringLiteral]: this._regExpOrStringLiteral,
        };

        this.reset();
    }

    // Public

    tokenize(input)
    {
        this.reset();
        this._input = input;

        while (this._index < this._input.length) {
            let stateFunction = this._stateFunctions[this._states.lastValue];
            console.assert(stateFunction);
            if (!stateFunction) {
                this.reset();
                return null;
            }

            stateFunction.call(this);
        }

        // Needed for trailing plain text.
        this._finishPlainText();

        return this._tokens;
    }

    reset()
    {
        this._input = "";
        this._buffer = "";

        this._index = 0;
        this._states = [WI.BreakpointLogMessageLexer.State.PlainText];
        this._literalStartCharacter = "";
        this._curlyBraceDepth = 0;
        this._tokens = [];
    }

    // Private

     _finishPlainText()
    {
        this._appendToken(WI.BreakpointLogMessageLexer.TokenType.PlainText);
    }

    _finishExpression()
    {
        this._appendToken(WI.BreakpointLogMessageLexer.TokenType.Expression);
    }

    _appendToken(type)
    {
        if (!this._buffer)
            return;

        this._tokens.push({type, data: this._buffer});
        this._buffer = "";
    }

    _consume()
    {
        console.assert(this._index < this._input.length);

        let character = this._peek();
        this._index++;
        return character;
    }

    _peek()
    {
        return this._input[this._index] || null;
    }

    // States

    _expression()
    {
        let character = this._consume();

        if (character === "}") {
            if (this._curlyBraceDepth === 0) {
                this._finishExpression();

                console.assert(this._states.lastValue === WI.BreakpointLogMessageLexer.State.Expression);
                this._states.pop();
                return;
            }

            this._curlyBraceDepth--;
        }

        this._buffer += character;

        if (character === "/" || character === "\"" || character === "'") {
            this._literalStartCharacter = character;
            this._states.push(WI.BreakpointLogMessageLexer.State.RegExpOrStringLiteral);
        } else if (character === "{")
            this._curlyBraceDepth++;
    }

    _plainText()
    {
        let character = this._peek();

        if (character === "$")
            this._states.push(WI.BreakpointLogMessageLexer.State.PossiblePlaceholder);
        else {
            this._buffer += character;
            this._consume();
        }
    }

    _possiblePlaceholder()
    {
        let character = this._consume();
        console.assert(character === "$");
        let nextCharacter = this._peek();

        console.assert(this._states.lastValue === WI.BreakpointLogMessageLexer.State.PossiblePlaceholder);
        this._states.pop();

        if (nextCharacter === "{") {
            this._finishPlainText();
            this._consume();
            this._states.push(WI.BreakpointLogMessageLexer.State.Expression);
        } else
            this._buffer += character;
    }

    _regExpOrStringLiteral()
    {
        let character = this._consume();
        this._buffer += character;

        if (character === "\\") {
            if (this._peek() !== null)
                this._buffer += this._consume();
            return;
        }

        if (character === this._literalStartCharacter) {
            console.assert(this._states.lastValue === WI.BreakpointLogMessageLexer.State.RegExpOrStringLiteral);
            this._states.pop();
        }
    }
};

WI.BreakpointLogMessageLexer.State = {
    Expression: Symbol("expression"),
    PlainText: Symbol("plain-text"),
    PossiblePlaceholder: Symbol("possible-placeholder"),
    RegExpOrStringLiteral: Symbol("regexp-or-string-literal"),
};

WI.BreakpointLogMessageLexer.TokenType = {
    PlainText: "token-type-plain-text",
    Expression: "token-type-expression",
};
