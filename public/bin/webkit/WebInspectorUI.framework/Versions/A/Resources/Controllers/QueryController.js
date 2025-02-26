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

WI.QueryController = class QueryController
{
    // Public

    executeQuery(query)
    {
        throw WI.NotImplementedError.subclassMustOverride();
    }

    findQueryMatches(query, searchString, specialCharacterIndices)
    {
        if (query.length > searchString.length)
            return [];

        let matches = [];
        let queryIndex = 0;
        let searchIndex = 0;
        let specialIndex = 0;
        let deadBranches = (new Array(query.length)).fill(Infinity);
        let type = WI.QueryMatch.Type.Special;

        function pushMatch(index) {
            matches.push(new WI.QueryMatch(type, index, queryIndex));
            searchIndex = index + 1;
            queryIndex++;
        }

        function matchNextSpecialCharacter() {
            if (specialIndex >= specialCharacterIndices.length)
                return false;

            let originalSpecialIndex = specialIndex;
            while (specialIndex < specialCharacterIndices.length) {
                // Normal character matching can move past special characters,
                // so advance the special character index if it's before the
                // current search string position.
                let index = specialCharacterIndices[specialIndex++];
                if (index < searchIndex)
                    continue;

                if (query[queryIndex] === searchString[index]) {
                    pushMatch(index);
                    return true;
                }
            }

            specialIndex = originalSpecialIndex;
            return false;
        }

        function backtrack() {
            while (matches.length) {
                queryIndex--;

                let lastMatch = matches.pop();
                if (lastMatch.type !== WI.QueryMatch.Type.Special)
                    continue;

                deadBranches[lastMatch.queryIndex] = lastMatch.index;
                searchIndex = matches.lastValue ? matches.lastValue.index + 1 : 0;
                return true;
            }

            return false;
        }

        while (queryIndex < query.length && searchIndex <= searchString.length) {
            if (type === WI.QueryMatch.Type.Special && !matchNextSpecialCharacter())
                type = WI.QueryMatch.Type.Normal;

            if (type === WI.QueryMatch.Type.Normal) {
                let index = searchString.indexOf(query[queryIndex], searchIndex);
                if (index >= 0 && index < deadBranches[queryIndex]) {
                    pushMatch(index);
                    type = WI.QueryMatch.Type.Special;
                } else if (!backtrack())
                    return [];
            }
        }

        if (queryIndex < query.length)
            return [];

        return matches;
    }

    // Protected

    findSpecialCharacterIndices(string, separators)
    {
        if (!string.length)
            return [];

        // Special characters include the following:
        // - The first character.
        // - Uppercase characters that follow a lowercase letter.
        // - Separators and the first character following the separator.

        let indices = [0];

        for (let i = 1; i < string.length; ++i) {
            let character = string[i];
            let isSpecial = false;

            if (separators.includes(character))
                isSpecial = true;
            else {
                let previousCharacter = string[i - 1];
                if (separators.includes(previousCharacter))
                    isSpecial = true;
                else if (character.isUpperCase() && previousCharacter.isLowerCase())
                    isSpecial = true;
            }

            if (isSpecial)
                indices.push(i);
        }

        return indices;
    }
};
