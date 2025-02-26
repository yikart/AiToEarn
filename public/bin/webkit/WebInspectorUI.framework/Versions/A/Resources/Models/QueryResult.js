/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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

WI.QueryResult = class QueryResult
{
    constructor(value, matches)
    {
        console.assert(matches.length, "Query matches list can't be empty.");

        this._value = value;
        this._matches = matches;
    }

    // Public

    get value() { return this._value; }
    get matches() { return this._matches; }

    get rank()
    {
        if (this._rank === undefined)
            this._calculateRank();

        return this._rank;
    }

    get matchingTextRanges()
    {
        this._matchingTextRanges ??= this._createMatchingTextRanges();

        return this._matchingTextRanges;
    }

    // Private

    _calculateRank()
    {
        const normalWeight = 10;
        const consecutiveWeight = 5;
        const specialMultiplier = 5;

        function getMultiplier(match) {
            if (match.type === WI.QueryMatch.Type.Special)
                return specialMultiplier;

            return 1;
        }

        this._rank = 0;

        let previousMatch = null;
        let consecutiveMatchStart = null;
        for (let match of this._matches) {
            this._rank += normalWeight * getMultiplier(match);

            let consecutive = previousMatch && previousMatch.index === match.index - 1;
            if (consecutive) {
                if (!consecutiveMatchStart)
                    consecutiveMatchStart = previousMatch;

                // If the first match in this consecutive series was a special character, give a
                // bonus (more likely to match a specific word in the text).  Otherwise, multiply
                // by the current length of the consecutive sequence (gives priority to fewer
                // longer sequences instead of more short sequences).
                this._rank += consecutiveWeight * getMultiplier(consecutiveMatchStart) * (match.index - consecutiveMatchStart.index);
            } else if (consecutiveMatchStart)
                consecutiveMatchStart = null;

            previousMatch = match;

            // The match index is deducted from the total rank, so matches that occur closer to
            // the beginning of the string are ranked higher.  Increase the amount subtracted if
            // the match is special, so as to favor matches towards the beginning of the string.
            if (!consecutive)
                this._rank -= match.index * getMultiplier(match);
        }
    }

    _createMatchingTextRanges()
    {
        if (!this._matches.length)
            return [];

        let ranges = [];
        let startIndex = this._matches[0].index;
        let endIndex = startIndex;
        for (let i = 1; i < this._matches.length; ++i) {
            let match = this._matches[i];

            // Increment endIndex for consecutive match.
            if (match.index === endIndex + 1) {
                endIndex++;
                continue;
            }

            // Begin a new range when a gap between this match and the previous match is found.
            ranges.push(new WI.TextRange(0, startIndex, 0, endIndex + 1));
            startIndex = match.index;
            endIndex = startIndex;
        }

        ranges.push(new WI.TextRange(0, startIndex, 0, endIndex + 1));
        return ranges;
    }

    // Testing

    set rankForTesting(rank) { this._rank = rank; }
};
