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

CSSFormatter = class CSSFormatter
{
    constructor(sourceText, builder, indentString = "    ")
    {
        this._success = false;

        this._sourceText = sourceText;

        this._builder = builder;
        if (!this._builder) {
            this._builder = new FormatterContentBuilder(indentString);
            this._builder.setOriginalLineEndings(this._sourceText.lineEndings());
        }

        this._format();

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

    _format()
    {
        const quoteTypes = new Set([`"`, `'`]);

        const dedentBefore = new Set([`}`]);

        const newlineBefore = new Set([`}`]);
        const newlineAfter = new Set([`{`, `}`, `;`]);

        const indentAfter = new Set([`{`]);

        const addSpaceBefore = new Set([`+`, `*`, `~`, `>`, `(`, `{`, `!`]);
        const addSpaceAfter = new Set([`,`, `+`, `*`, `~`, `>`, `)`, `:`]);

        const removeSpaceBefore = new Set([`,`, `(`, `)`, `}`, `:`, `;`]);
        const removeSpaceAfter = new Set([`(`, `{`, `}`, `,`, `!`, `;`]);

        const whitespaceOnlyRegExp = /^\s*$/;

        const inAtRuleRegExp = /^\s*@[a-zA-Z][-a-zA-Z]+/;
        const inAtRuleBeforeParenthesisRegExp = /^\s*@[a-zA-Z][-a-zA-Z]+$/;
        const inAtRuleAfterParenthesisRegExp = /^\s*@[a-zA-Z][-a-zA-Z]+[^("':]*\([^"':]*:/;
        const inAtSupportsRuleRegExp = /^\s*@[a-zA-Z][-a-zA-Z]+[^"':]*:/;

        const lineStartCouldBePropertyRegExp = /^\s+[-_a-zA-Z][-_a-zA-Z0-9]*/;

        const lastTokenWasOpenParenthesisRegExp = /\(\s*$/;

        let depth = 0;
        let specialSequenceStack = [];

        let index = 0;
        let current = null;

        let testCurrentLine = (regExp) => regExp.test(this._builder.currentLine);

        let inSelector = () => {
            let nextOpenBrace = this._sourceText.indexOf(`{`, index);
            if (nextOpenBrace !== -1) {
                let nextQuote = Infinity;
                for (let quoteType of quoteTypes) {
                    let quoteIndex = this._sourceText.indexOf(quoteType, index);
                    if (quoteIndex !== -1 && quoteIndex < nextQuote)
                        nextQuote = quoteIndex;
                }
                if (nextOpenBrace < nextQuote) {
                    let nextSemicolon = this._sourceText.indexOf(`;`, index);
                    if (nextSemicolon === -1)
                        nextSemicolon = Infinity;

                    let nextNewline = this._sourceText.indexOf(`\n`, index);
                    if (nextNewline === -1)
                        nextNewline = Infinity;

                    if (nextOpenBrace < Math.min(nextSemicolon, nextNewline))
                        return true;
                }
            }

            if (testCurrentLine(lineStartCouldBePropertyRegExp))
                return false;

            return true;
        };

        let inProperty = () => {
            if (!depth)
                return false;
            return !testCurrentLine(inAtRuleRegExp) && !inSelector();
        };

        let formatBefore = () => {
            if (this._builder.lastNewlineAppendWasMultiple && current === `}`)
                this._builder.removeLastNewline();

            if (dedentBefore.has(current))
                this._builder.dedent();

            if (!this._builder.lastTokenWasNewline && newlineBefore.has(current))
                this._builder.appendNewline();

            if (!this._builder.lastTokenWasWhitespace && addSpaceBefore.has(current)) {
                let shouldAddSpaceBefore = () => {
                    if (current === `(`) {
                        if (testCurrentLine(inAtSupportsRuleRegExp))
                            return false;
                        if (!testCurrentLine(inAtRuleRegExp))
                            return false;
                    }
                    return true;
                };
                if (shouldAddSpaceBefore())
                    this._builder.appendSpace();
            }

            while (this._builder.lastTokenWasWhitespace && removeSpaceBefore.has(current)) {
                let shouldRemoveSpaceBefore = () => {
                    if (current === `:`) {
                        if (!testCurrentLine(this._builder.currentLine.includes(`(`) ? inAtRuleRegExp : inAtRuleBeforeParenthesisRegExp)) {
                            if (!inProperty())
                                return false;
                        }
                    }
                    if (current === `(`) {
                        if (!testCurrentLine(lastTokenWasOpenParenthesisRegExp)) {
                            if (testCurrentLine(inAtRuleRegExp) && !testCurrentLine(inAtRuleAfterParenthesisRegExp))
                                return false;
                        }
                    }
                    return true;
                };
                if (!shouldRemoveSpaceBefore())
                    break;
                this._builder.tryRemoveLastWhitespace();
            }
        };

        let formatAfter = () => {
            while (this._builder.lastTokenWasWhitespace && removeSpaceAfter.has(current)) {
                let shouldRemoveSpaceAfter = () => {
                    if (current === `(`) {
                        if (!testCurrentLine(lastTokenWasOpenParenthesisRegExp)) {
                            if (!testCurrentLine(inAtRuleRegExp)) {
                                if (!inProperty())
                                    return false;
                            }
                        }
                    }
                    return true;
                };
                if (!shouldRemoveSpaceAfter())
                    break;
                this._builder.tryRemoveLastWhitespace();
            }

            if (!this._builder.lastTokenWasWhitespace && addSpaceAfter.has(current)) {
                let shouldAddSpaceAfter = () => {
                    if (current === `:`) {
                        if (!testCurrentLine(this._builder.currentLine.includes(`(`) ? inAtRuleRegExp : inAtRuleBeforeParenthesisRegExp)) {
                            if (!inProperty())
                                return false;
                        }
                    }
                    if (current === `)`) {
                        if (!testCurrentLine(inAtRuleRegExp)) {
                            if (!inProperty())
                                return false;
                        }
                    }
                    return true;
                };
                if (shouldAddSpaceAfter())
                    this._builder.appendSpace();
            }

            if (indentAfter.has(current))
                this._builder.indent();

            if (newlineAfter.has(current)) {
                if (current === `}`)
                    this._builder.appendMultipleNewlines(2);
                else
                    this._builder.appendNewline();
            }
        };

        for (; index < this._sourceText.length; ++index) {
            current = this._sourceText[index];

            let possibleSpecialSequence = null;
            if (quoteTypes.has(current))
                possibleSpecialSequence = {type: "quote", startIndex: index, endString: current};
            else if (current === `/` && this._sourceText[index + 1] === `*`)
                possibleSpecialSequence = {type: "comment", startIndex: index, endString: `*/`};
            else if (current === `u` && this._sourceText[index + 1] === `r` && this._sourceText[index + 2] === `l` && this._sourceText[index + 3] === `(`)
                possibleSpecialSequence = {type: "url", startIndex: index, endString: `)`};

            if (possibleSpecialSequence || specialSequenceStack.length) {
                let currentSpecialSequence = specialSequenceStack.lastValue;

                if (currentSpecialSequence?.type !== "comment") {
                    if (possibleSpecialSequence?.type !== "comment") {
                        let escapeCount = 0;
                        while (this._sourceText[index - 1 - escapeCount] === "\\")
                            ++escapeCount;
                        if (escapeCount % 2)
                            continue;
                    }

                    if (possibleSpecialSequence && (!currentSpecialSequence || currentSpecialSequence.type !== possibleSpecialSequence.type || currentSpecialSequence.endString !== possibleSpecialSequence.endString)) {
                        specialSequenceStack.push(possibleSpecialSequence);
                        continue;
                    }
                }

                if (Array.from(currentSpecialSequence.endString).some((item, i) => index + i < this._sourceText.length && this._sourceText[index - currentSpecialSequence.endString.length + i + 1] !== item))
                    continue;

                let inComment = specialSequenceStack.some((item) => item.type === "comment");

                specialSequenceStack.pop();
                if (specialSequenceStack.length)
                    continue;

                let specialSequenceText = this._sourceText.substring(currentSpecialSequence.startIndex, index + 1);

                let lastSourceNewlineWasMultiple = this._sourceText[currentSpecialSequence.startIndex - 1] === `\n` && this._sourceText[currentSpecialSequence.startIndex - 2] === `\n`;
                let lastAppendNewlineWasMultiple = this._builder.lastNewlineAppendWasMultiple;

                let commentOnOwnLine = false;
                if (inComment) {
                    commentOnOwnLine = testCurrentLine(whitespaceOnlyRegExp);

                    if (!commentOnOwnLine || lastAppendNewlineWasMultiple) {
                        while (this._builder.lastTokenWasNewline)
                            this._builder.removeLastNewline();
                    }

                    if (commentOnOwnLine) {
                        if (currentSpecialSequence.startIndex > 0 && !this._builder.indented)
                            this._builder.appendNewline();
                    } else if (this._builder.currentLine.length && !this._builder.lastTokenWasWhitespace)
                        this._builder.appendSpace();

                    if (this._builder.lastTokenWasNewline && lastSourceNewlineWasMultiple)
                        this._builder.appendNewline(true);
                }

                this._builder.appendStringWithPossibleNewlines(specialSequenceText, currentSpecialSequence.startIndex);

                if (inComment) {
                    if (commentOnOwnLine) {
                        if (lastAppendNewlineWasMultiple && !lastSourceNewlineWasMultiple)
                            this._builder.appendMultipleNewlines(2);
                        else
                            this._builder.appendNewline();
                    } else if (!/\s/.test(current)) {
                        if (!testCurrentLine(inAtRuleRegExp) && !inSelector() && !inProperty())
                            this._builder.appendNewline();
                        else
                            this._builder.appendSpace();
                    }
                }

                formatAfter();
                continue;
            }

            if (/\s/.test(current)) {
                if (current === `\n`) {
                    if (!this._builder.lastTokenWasNewline) {
                        while (this._builder.lastTokenWasWhitespace)
                            this._builder.tryRemoveLastWhitespace();
                        if (!removeSpaceAfter.has(this._builder.lastToken))
                            this._builder.appendNewline();
                        else
                            this._builder.appendSpace();
                    }
                } else if (!this._builder.lastTokenWasWhitespace && !removeSpaceAfter.has(this._builder.lastToken))
                    this._builder.appendSpace();
                continue;
            }

            if (current === `{`)
                ++depth;
            else if (current === `}`)
                --depth;

            formatBefore();
            this._builder.appendToken(current, index);
            formatAfter();
        }

        if (specialSequenceStack.length) {
            let firstSpecialSequence = specialSequenceStack[0];
            this._builder.appendStringWithPossibleNewlines(this._sourceText.substring(firstSpecialSequence.startIndex), firstSpecialSequence.startIndex);
        }

        this._builder.finish();
    }
};
