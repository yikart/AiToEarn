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

WI.ResourceQueryController = class ResourceQueryController extends WI.QueryController
{
    constructor()
    {
        super();

        this._resourceDataMap = new Map;
    }

    // Public

    addResource(resource)
    {
        this._resourceDataMap.set(resource, {});
    }

    removeResource(resource)
    {
        this._resourceDataMap.delete(resource);
    }

    reset()
    {
        this._resourceDataMap.clear();
    }

    executeQuery(query)
    {
        if (!query || !this._resourceDataMap.size)
            return [];

        query = query.removeWhitespace().toLowerCase();

        let cookie = null;
        if (query.includes(":")) {
            let [newQuery, lineNumber, columnNumber] = query.split(":");
            query = newQuery;
            lineNumber = lineNumber ? parseInt(lineNumber, 10) - 1 : 0;
            columnNumber = columnNumber ? parseInt(columnNumber, 10) - 1 : 0;
            cookie = {lineNumber, columnNumber};
        }

        let results = [];
        for (let [resource, cachedData] of this._resourceDataMap) {
            if (isEmptyObject(cachedData)) {
                let displayName = resource.displayName;
                cachedData.displayName = {
                    searchString: displayName.toLowerCase(),
                    specialCharacterIndices: this._findSpecialCharacterIndicesInDisplayName(displayName),
                };

                let url = resource.url;
                cachedData.url = {
                    searchString: url.toLowerCase(),
                    specialCharacterIndices: this._findSpecialCharacterIndicesInURL(url),
                };
            }

            let resourceResult = null;

            let findQueryMatches = ({searchString, specialCharacterIndices}) => {
                let matches = this.findQueryMatches(query, searchString, specialCharacterIndices);
                if (!matches.length)
                    return;

                let queryResult = new WI.ResourceQueryResult(resource, searchString, matches, cookie);
                if (!resourceResult || resourceResult.rank < queryResult.rank)
                    resourceResult = queryResult;
            };
            findQueryMatches(cachedData.displayName);
            findQueryMatches(cachedData.url);

            if (resourceResult)
                results.push(resourceResult);
        }

        // Resources are sorted in descending order by rank. Resources of equal
        // rank are sorted by display name.
        return results.sort((a, b) => {
            if (a.rank === b.rank)
                return a.resource.displayName.extendedLocaleCompare(b.resource.displayName);
            return b.rank - a.rank;
        });
    }

    // Private

    _findSpecialCharacterIndicesInDisplayName(displayName)
    {
        return this.findSpecialCharacterIndices(displayName, "_.-");
    }

    _findSpecialCharacterIndicesInURL(url)
    {
        return this.findSpecialCharacterIndices(url, "_.-/");
    }
};
