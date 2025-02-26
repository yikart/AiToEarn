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

WI.CSSQueryController = class CSSQueryController extends WI.QueryController
{
    constructor(values)
    {
        console.assert(Array.isArray(values), values);

        super();

        this._values = values || [];
        this._cachedSpecialCharacterIndicesForValueMap = new Map;
    }

    // Public

    addValues(values)
    {
        console.assert(Array.isArray(values), values);
        if (!values.length)
            return;

        this._values.pushAll(values);
    }

    reset()
    {
        this._values = [];
        this._cachedSpecialCharacterIndicesForValueMap.clear();
    }

    executeQuery(query)
    {
        if (!query || !this._values.length)
            return [];

        query = query.toLowerCase();

        let results = [];

        for (let value of this._values) {
            if (!this._cachedSpecialCharacterIndicesForValueMap.has(value))
                this._cachedSpecialCharacterIndicesForValueMap.set(value, this._findSpecialCharacterIndicesInPropertyName(value));

            let matches = this.findQueryMatches(query, value.toLowerCase(), this._cachedSpecialCharacterIndicesForValueMap.get(value));
            if (matches.length)
                results.push(new WI.QueryResult(value, matches));
        }

        return results.sort((a, b) => {
            if (a.rank === b.rank)
                return WI.CSSProperty.sortPreferringNonPrefixed(a.value, b.value);
            return b.rank - a.rank;
        });
    }

    // Private

    _findSpecialCharacterIndicesInPropertyName(propertyName)
    {
        return this.findSpecialCharacterIndices(propertyName, "-_");
    }
};
