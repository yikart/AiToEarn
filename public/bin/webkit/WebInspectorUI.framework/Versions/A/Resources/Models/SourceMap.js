/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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

WI.SourceMap = class SourceMap
{
    constructor(sourceMappingURL, originalSourceCode, payload)
    {
        console.assert(typeof sourceMappingURL === "string", sourceMappingURL);
        console.assert(originalSourceCode instanceof WI.SourceCode, originalSourceCode);

        WI.SourceMap._instances.add(this);

        if (!WI.SourceMap._base64Map) {
            var base64Digits = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
            WI.SourceMap._base64Map = {};
            for (var i = 0; i < base64Digits.length; ++i)
                WI.SourceMap._base64Map[base64Digits.charAt(i)] = i;
        }

        this._originalSourceCode = originalSourceCode;
        this._sourceMapResources = new Map;

        this._sourceMappingURL = sourceMappingURL;
        this._reverseMappingsBySourceURL = {};
        this._mappings = [];
        this._sourceRoot = null;
        this._sourceContentByURL = {};
        this._parseMappingPayload(payload);
    }

    // Static

    static get instances()
    {
        return Array.from(WI.SourceMap._instances);
    }

    // Public

    get sourceMappingURL() { return this._sourceMappingURL; }

    get originalSourceCode()
    {
        return this._originalSourceCode;
    }

    get sourceMappingBasePathURLComponents()
    {
        if (this._sourceMappingURLBasePathComponents)
            return this._sourceMappingURLBasePathComponents;

        if (this._sourceRoot) {
            var baseURLPath = absoluteURL(this._sourceRoot, this._sourceMappingURL);
            console.assert(baseURLPath);
            if (baseURLPath) {
                var urlComponents = parseURL(baseURLPath);
                if (!/\/$/.test(urlComponents.path))
                    urlComponents.path += "/";
                this._sourceMappingURLBasePathComponents = urlComponents;
                return this._sourceMappingURLBasePathComponents;
            }
        }

        var urlComponents = parseURL(this._sourceMappingURL);

        // Fallback for JavaScript debuggable named scripts that may not have a complete URL.
        if (!urlComponents.path)
            urlComponents.path = this._sourceMappingURL || "";

        urlComponents.path = urlComponents.path.substr(0, urlComponents.path.lastIndexOf(urlComponents.lastPathComponent));
        urlComponents.lastPathComponent = null;
        this._sourceMappingURLBasePathComponents = urlComponents;
        return this._sourceMappingURLBasePathComponents;
    }

    get resources()
    {
        return Array.from(this._sourceMapResources.values());
    }

    resourceForURL(url)
    {
        return this._sourceMapResources.get(url);
    }

    sourceContent(sourceURL)
    {
        return this._sourceContentByURL[sourceURL];
    }

    calculateBlackboxSourceRangesForProtocol()
    {
        console.assert(this._originalSourceCode instanceof WI.Script, this._originalSourceCode);

        let blackboxedURLs = {};

        let sourceRanges = [];

        let startLine = undefined;
        let startColumn = undefined;
        for (let [lineNumber, columnNumber, url] of this._mappings) {
            if (!url)
                continue;

            blackboxedURLs[url] ??= !!WI.debuggerManager.blackboxDataForSourceCode(this._sourceMapResources.get(url));

            if (blackboxedURLs[url]) {
                startLine ??= lineNumber;
                startColumn ??= columnNumber;
            } else if (startLine !== undefined && startColumn !== undefined) {
                sourceRanges.push(startLine, startColumn, lineNumber, columnNumber);

                startLine = undefined;
                startColumn = undefined;
            }
        }
        if (startLine !== undefined && startColumn !== undefined)
            sourceRanges.push(startLine, startColumn, this._originalSourceCode.range.endLine, this._originalSourceCode.range.endColumn);

        return sourceRanges;
    }

    _parseMappingPayload(mappingPayload)
    {
        if (!mappingPayload || typeof mappingPayload !== "object")
            throw this._invalidPropertyError(WI.unlocalizedString("json"));

        if (mappingPayload.version !== 3)
            throw this._invalidPropertyError(WI.unlocalizedString("version"));

        if ("file" in mappingPayload && typeof mappingPayload.file !== "string")
            throw this._invalidPropertyError(WI.unlocalizedString("file"));
        // Currently `file` is unused, but check it anyways for conformance.

        if (Array.isArray(mappingPayload.sections)) {
            if ("mappings" in mappingPayload)
                throw this._invalidPropertyError(WI.unlocalizedString("mappings"));

            let lastLineNumber = -1;
            let lastColumnNumber = -1;

            for (let section of mappingPayload.sections) {
                if (!section.offset || typeof section.offset !== "object")
                    throw this._invalidPropertyError(WI.unlocalizedString("offset"));

                if (!section.map || typeof section.map !== "object")
                    throw this._invalidPropertyError(WI.unlocalizedString("map"));

                let offsetLineNumber = section.offset.line;
                if (!Number.isInteger(offsetLineNumber) || offsetLineNumber < 0 || offsetLineNumber < lastLineNumber)
                    throw this._invalidPropertyError(WI.unlocalizedString("offset.line"));

                let offsetColumnNumber = section.offset.column;
                if (!Number.isInteger(offsetColumnNumber) || offsetColumnNumber < 0 || (offsetLineNumber === lastLineNumber && offsetColumnNumber <= lastColumnNumber))
                    throw this._invalidPropertyError(WI.unlocalizedString("offset.column"));

                this._parseMap(section.map, offsetLineNumber, offsetColumnNumber);

                lastLineNumber = offsetLineNumber;
                lastColumnNumber = offsetColumnNumber;
            }
        } else
            this._parseMap(mappingPayload, 0, 0);
    }

    findEntry(lineNumber, columnNumber)
    {
        var first = 0;
        var count = this._mappings.length;
        while (count > 1) {
            var step = count >> 1;
            var middle = first + step;
            var mapping = this._mappings[middle];
            if (lineNumber < mapping[0] || (lineNumber === mapping[0] && columnNumber < mapping[1]))
                count = step;
            else {
                first = middle;
                count -= step;
            }
        }
        var entry = this._mappings[first];
        if (!first && entry && (lineNumber < entry[0] || (lineNumber === entry[0] && columnNumber < entry[1])))
            return null;
        return entry;
    }

    findEntryReversed(sourceURL, lineNumber)
    {
        var mappings = this._reverseMappingsBySourceURL[sourceURL];
        for ( ; lineNumber < mappings.length; ++lineNumber) {
            var mapping = mappings[lineNumber];
            if (mapping)
                return mapping;
        }
        return this._mappings[0];
    }

    _parseMap(map, offsetLineNumber, offsetColumnNumber)
    {
        if (typeof map.mappings !== "string")
            throw this._invalidPropertyError(WI.unlocalizedString("mappings"));

        if (!Array.isArray(map.sources))
            throw this._invalidPropertyError(WI.unlocalizedString("sources"));

        if ("sourceRoot" in map && typeof map.sourceRoot !== "string")
            throw this._invalidPropertyError(WI.unlocalizedString("sourceRoot"));
        this._sourceRoot = map.sourceRoot || null;

        if ("sourcesContent" in map && !Array.isArray(map.sourcesContent))
            throw this._invalidPropertyError(WI.unlocalizedString("sourcesContent"));

        if ("ignoreList" in map && (!Array.isArray(map.ignoreList) || map.ignoreList.some((index) => index !== null && (!Number.isInteger(index) || index < 0 || index >= map.sources.length))))
            throw this._invalidPropertyError(WI.unlocalizedString("ignoreList"));
        let ignoreList = new Set(map.ignoreList || []);

        if ("names" in map && (!Array.isArray(map.names) || map.names.some((name) => typeof name !== "string")))
            throw this._invalidPropertyError(WI.unlocalizedString("names"));
        // Currently `names` is unused, but check it anyways for conformance.

        var sources = [];
        for (var i = 0; i < map.sources.length; ++i) {
            let source = map.sources[i];
            if (source !== null && typeof source !== "string")
                throw this._invalidPropertyError(WI.unlocalizedString("sources"));

            if (source) {
                if (this._sourceRoot && source.charAt(0) !== "/")
                    source = this._sourceRoot.replace(/\/+$/, "") + "/" + source;
                source = absoluteURL(source, this._sourceMappingURL) || source;
            }

            sources.push(source);

            let sourceMapResource = new WI.SourceMapResource(source, this, {
                ignored: ignoreList.has(i),
            });
            console.assert(!this._sourceMapResources.has(sourceMapResource.url), sourceMapResource);
            this._sourceMapResources.set(sourceMapResource.url, sourceMapResource);

            if (map.sourcesContent) {
                let sourceContent = map.sourcesContent[i];
                if (sourceContent !== null && typeof sourceContent !== "string")
                    throw this._invalidPropertyError(WI.unlocalizedString("sourcesContent"));

                this._sourceContentByURL[sourceMapResource.url] = sourceContent;
            }
        }

        var stringCharIterator = new WI.SourceMap.StringCharIterator(map.mappings);
        let originalLine = 0;
        let originalColumn = 0;
        let sourceIndex = 0;
        let nameIndex = 0;
        let generatedLine = offsetLineNumber;
        let generatedColumn = offsetColumnNumber;

        while (true) {
            if (stringCharIterator.peek() === ",")
                stringCharIterator.next();
            else {
                while (stringCharIterator.peek() === ";") {
                    ++generatedLine;
                    generatedColumn = 0;
                    stringCharIterator.next();
                }
                if (!stringCharIterator.hasNext())
                    break;
            }

            let relativeGeneratedColumn = this._decodeVLQ(stringCharIterator);
            if (relativeGeneratedColumn === WI.SourceMap.VLQ_AT_SEPARATOR)
                throw this._invalidPropertyError(WI.unlocalizedString("mappings"));

            generatedColumn += relativeGeneratedColumn;
            if (generatedColumn < 0)
                throw this._invalidPropertyError(WI.unlocalizedString("mappings"));

            let relativeSourceIndex = this._decodeVLQ(stringCharIterator);
            let relativeOriginalLine = this._decodeVLQ(stringCharIterator);
            let relativeOriginalColumn = this._decodeVLQ(stringCharIterator);
            if (relativeOriginalColumn === WI.SourceMap.VLQ_AT_SEPARATOR) {
                if (relativeSourceIndex !== WI.SourceMap.VLQ_AT_SEPARATOR)
                    throw this._invalidPropertyError(WI.unlocalizedString("mappings"));

                console.assert(relativeOriginalLine === WI.SourceMap.VLQ_AT_SEPARATOR, relativeOriginalLine);
                this._mappings.push([generatedLine, generatedColumn]);
                continue;
            }

            sourceIndex += relativeSourceIndex;
            originalLine += relativeOriginalLine;
            originalColumn += relativeOriginalColumn;
            if (sourceIndex < 0 || sourceIndex >= sources.length || originalLine < 0 || originalColumn < 0)
                throw this._invalidPropertyError(WI.unlocalizedString("mappings"));

            let relativeNameIndex = this._decodeVLQ(stringCharIterator);
            if (relativeNameIndex !== WI.SourceMap.VLQ_AT_SEPARATOR) {
                nameIndex += relativeNameIndex;
                if (nameIndex < 0 || nameIndex >= map.names.length)
                    throw this._invalidPropertyError(WI.unlocalizedString("mappings"));
                // Currently `names` is unused, but check it anyways for conformance.
            }

            if (stringCharIterator.hasNext() && !this._isSeparator(stringCharIterator.peek()))
                throw this._invalidPropertyError(WI.unlocalizedString("mappings"));

            this._mappings.push([generatedLine, generatedColumn, sources[sourceIndex], originalLine, originalColumn]);
        }

        // Ensure ordering for binary search in `findEntry` in case there are negative offsets.
        this._mappings.sort((a, b) => {
            return a[0] - b[0] // generatedLine
                || a[1] - b[1] // generatedColumn
                || !a[2] - !b[2] // sourceURL (if present)
                || (a[3] ?? 0) - (b[3] ?? 0) // originalLine (if present)
                || (a[4] ?? 0) - (b[4] ?? 0); // originalColumn (if present)
        });

        for (var i = 0; i < this._mappings.length; ++i) {
            var mapping = this._mappings[i];
            var url = mapping[2];
            if (!url)
                continue;
            if (!this._reverseMappingsBySourceURL[url])
                this._reverseMappingsBySourceURL[url] = [];
            var reverseMappings = this._reverseMappingsBySourceURL[url];
            var sourceLine = mapping[3];
            if (!reverseMappings[sourceLine])
                reverseMappings[sourceLine] = [mapping[0], mapping[1]];
        }
    }

    _isSeparator(char)
    {
        return char === "," || char === ";";
    }

    _decodeVLQ(stringCharIterator)
    {
        if (!stringCharIterator.hasNext() || this._isSeparator(stringCharIterator.peek()))
            return WI.SourceMap.VLQ_AT_SEPARATOR;

        let char = stringCharIterator.next();
        if (!(char in WI.SourceMap._base64Map))
            throw this._invalidPropertyError(WI.unlocalizedString("mappings"));

        let byte = WI.SourceMap._base64Map[char];
        let sign = byte & 0x01 ? -1 : 1;
        let value = (byte >> 1) & 0x0F;
        let shift = 16;
        while (byte & 0x20) {
            if (!stringCharIterator.hasNext() || this._isSeparator(stringCharIterator.peek()))
                throw this._invalidPropertyError(WI.unlocalizedString("mappings"));

            char = stringCharIterator.next();
            if (!(char in WI.SourceMap._base64Map))
                throw this._invalidPropertyError(WI.unlocalizedString("mappings"));

            byte = WI.SourceMap._base64Map[char];
            let chunk = byte & 0x1F;
            value += chunk * shift;
            if (value >= 2_147_483_648)
                throw this._invalidPropertyError(WI.unlocalizedString("mappings"));
            shift *= 32;
        }

        if (value === 0 && sign === -1)
            return -2_147_483_648;

        return value * sign;
    }

    _invalidPropertyError(property)
    {
        const message = WI.UIString("invalid \u0022%s\u0022", "invalid \u0022%s\u0022 @ Source Map", "Error message template when failing to parse a JS source map.");
        return message.format(property);
    }
};

WI.SourceMap._instances = new IterableWeakSet;

WI.SourceMap.VLQ_AT_SEPARATOR = Symbol("separator");
WI.SourceMap.VLQ_BASE_SHIFT = 5;
WI.SourceMap.VLQ_BASE_MASK = (1 << 5) - 1;
WI.SourceMap.VLQ_CONTINUATION_MASK = 1 << 5;

WI.SourceMap.StringCharIterator = class StringCharIterator
{
    constructor(string)
    {
        this._string = string;
        this._position = 0;
    }

    next()
    {
        return this._string.charAt(this._position++);
    }

    peek()
    {
        return this._string.charAt(this._position);
    }

    hasNext()
    {
        return this._position < this._string.length;
    }
};
