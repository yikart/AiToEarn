/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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

class IterableWeakSet
{
    constructor(items = [])
    {
        this._wrappers = new Set;
        this._wrapperForItem = new WeakMap;

        for (let item of items)
            this.add(item);
    }

    // Public

    get size()
    {
        let size = 0;
        for (let wrapper of this._wrappers) {
            if (wrapper.deref())
                ++size;
        }
        return size;
    }

    has(item)
    {
        let result = this._wrapperForItem.has(item);
        console.assert(Array.from(this._wrappers).some((wrapper) => wrapper.deref() === item) === result, this, item);
        return result;
    }

    add(item)
    {
        console.assert(typeof item === "object", item);
        console.assert(item !== null, item);

        if (this.has(item))
            return;

        let wrapper = new WeakRef(item);
        this._wrappers.add(wrapper);
        this._wrapperForItem.set(item, wrapper);
        this._finalizationRegistry.register(item, {weakThis: new WeakRef(this), wrapper}, wrapper);
    }

    delete(item)
    {
        return !!this.take(item);
    }

    take(item)
    {
        let wrapper = this._wrapperForItem.get(item);
        if (!wrapper)
            return undefined;

        let itemDeleted = this._wrapperForItem.delete(item);
        console.assert(itemDeleted, this, item);

        let wrapperDeleted = this._wrappers.delete(wrapper);
        console.assert(wrapperDeleted, this, item);

        this._finalizationRegistry.unregister(wrapper);

        console.assert(wrapper.deref() === item, this, item);
        return item;
    }

    clear()
    {
        for (let wrapper of this._wrappers) {
            this._wrapperForItem.delete(wrapper);
            this._finalizationRegistry.unregister(wrapper);
        }

        this._wrappers.clear();
    }

    keys()
    {
        return this.values();
    }

    *values()
    {
        for (let wrapper of this._wrappers) {
            let item = wrapper.deref();
            console.assert(!item === !this._wrapperForItem.has(item), this, item);
            if (item)
                yield item;
        }
    }

    [Symbol.iterator]()
    {
        return this.values();
    }

    copy()
    {
        return new IterableWeakSet(this.toJSON());
    }

    toJSON()
    {
        return Array.from(this);
    }

    // Private

    get _finalizationRegistry()
    {
        return IterableWeakSet._finalizationRegistry ??= new FinalizationRegistry(function(heldValue) {
            heldValue.weakThis.deref()?._wrappers.delete(heldValue.wrapper);
        });
    }
}
