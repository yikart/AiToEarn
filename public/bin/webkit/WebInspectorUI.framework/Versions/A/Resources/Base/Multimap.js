/*
 * Copyright (C) 2018-2020 Apple Inc. All rights reserved.
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

class Multimap
{
    constructor(items = [])
    {
        this._map = new Map;

        for (let [key, value] of items)
            this.add(key, value);
    }

    // Public

    get size()
    {
        return this._map.size;
    }

    has(key, value)
    {
        let valueSet = this._map.get(key);
        if (!valueSet)
            return false;
        return value === undefined || valueSet.has(value);
    }

    get(key)
    {
        return this._map.get(key);
    }

    add(key, value)
    {
        let valueSet = this._map.get(key);
        if (!valueSet) {
            valueSet = new Set;
            this._map.set(key, valueSet);
        }
        valueSet.add(value);

        return this;
    }

    delete(key, value)
    {
        // Allow an entire key to be removed by not passing a value.
        if (arguments.length === 1)
            return this._map.delete(key);

        let valueSet = this._map.get(key);
        if (!valueSet)
            return false;

        let deleted = valueSet.delete(value);

        if (!valueSet.size)
            this._map.delete(key);

        return deleted;
    }

    take(key, value)
    {
        // Allow an entire key to be removed by not passing a value.
        if (arguments.length === 1)
            return this._map.take(key);

        let valueSet = this._map.get(key);
        if (!valueSet)
            return undefined;

        let result = valueSet.take(value);
        if (!valueSet.size)
            this._map.delete(key);
        return result;
    }

    clear()
    {
        this._map.clear();
    }

    keys()
    {
        return this._map.keys();
    }

    *values()
    {
        for (let valueSet of this._map.values()) {
            for (let value of valueSet)
                yield value;
        }
    }

    sets()
    {
        return this._map.entries();
    }

    *[Symbol.iterator]()
    {
        for (let [key, valueSet] of this._map) {
            for (let value of valueSet)
                yield [key, value];
        }
    }

    copy()
    {
        return new Multimap(this.toJSON());
    }

    toJSON()
    {
        return Array.from(this);
    }
}
