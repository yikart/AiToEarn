/*
 * Copyright (C) 2019 Apple Inc.  All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "ExceptionOr.h"
#include "SVGProperty.h"

namespace WebCore {

template<typename ItemType>
class SVGList : public SVGProperty {
public:
    unsigned length() const { return numberOfItems(); }

    unsigned numberOfItems() const
    {
        return m_items.size();
    }

    ExceptionOr<void> clear()
    {
        auto result = canAlterList();
        if (result.hasException())
            return result.releaseException();
        ASSERT(result.releaseReturnValue());

        clearItems();
        commitChange();
        return { };
    }

    ExceptionOr<ItemType> getItem(unsigned index)
    {
        auto result = canGetItem(index);
        if (result.hasException())
            return result.releaseException();
        ASSERT(result.releaseReturnValue());

        return at(index);
    }

    ExceptionOr<ItemType> initialize(ItemType&& newItem)
    {
        auto result = canAlterList();
        if (result.hasException())
            return result.releaseException();

        // Spec: Clears all existing current items from the list.
        clearItems();

        auto item = append(WTFMove(newItem));
        commitChange();
        return item;
    }

    ExceptionOr<ItemType> insertItemBefore(ItemType&& newItem, unsigned index)
    {
        auto result = canAlterList();
        if (result.hasException())
            return result.releaseException();
        ASSERT(result.releaseReturnValue());

        // Spec: If the index is greater than or equal to numberOfItems,
        // then the new item is appended to the end of the list.
        if (index > numberOfItems())
            index = numberOfItems();

        auto item = insert(index, WTFMove(newItem));
        commitChange();
        return item;
    }

    ExceptionOr<ItemType> replaceItem(ItemType&& newItem, unsigned index)
    {
        auto result = canReplaceItem(index);
        if (result.hasException())
            return result.releaseException();
        ASSERT(result.releaseReturnValue());

        auto item = replace(index, WTFMove(newItem));
        commitChange();
        return item;
    }

    ExceptionOr<ItemType> removeItem(unsigned index)
    {
        auto result = canRemoveItem(index);
        if (result.hasException())
            return result.releaseException();
        ASSERT(result.releaseReturnValue());

        auto item = remove(index);
        commitChange();
        return item;
    }

    ExceptionOr<ItemType> appendItem(ItemType&& newItem)
    {
        auto result = canAlterList();
        if (result.hasException())
            return result.releaseException();
        ASSERT(result.releaseReturnValue());

        auto item = append(WTFMove(newItem));
        commitChange();
        return item;
    }

    ExceptionOr<void> setItem(unsigned index, ItemType&& newItem)
    {
        auto result = replaceItem(WTFMove(newItem), index);
        if (result.hasException())
            return result.releaseException();
        return { };
    }

    bool isSupportedPropertyIndex(unsigned index) const { return index < m_items.size(); }

    // Parsers and animators need to have a direct access to the items.
    Vector<ItemType>& items() { return m_items; }
    const Vector<ItemType>& items() const { return m_items; }
    size_t size() const { return m_items.size(); }
    bool isEmpty() const { return m_items.isEmpty(); }

    void clearItems()
    {
        detachItems();
        m_items.clear();
    }

protected:
    using SVGProperty::SVGProperty;

    ExceptionOr<bool> canAlterList() const
    {
        if (isReadOnly())
            return Exception { ExceptionCode::NoModificationAllowedError };
        return true;
    }

    ExceptionOr<bool> canGetItem(unsigned index)
    {
        if (index >= m_items.size())
            return Exception { ExceptionCode::IndexSizeError };
        return true;
    }

    ExceptionOr<bool> canReplaceItem(unsigned index)
    {
        auto result = canAlterList();
        if (result.hasException())
            return result.releaseException();
        ASSERT(result.releaseReturnValue());

        if (index >= m_items.size())
            return Exception { ExceptionCode::IndexSizeError };
        return true;
    }

    ExceptionOr<bool> canRemoveItem(unsigned index)
    {
        auto result = canAlterList();
        if (result.hasException())
            return result.releaseException();
        ASSERT(result.releaseReturnValue());

        if (index >= m_items.size())
            return Exception { ExceptionCode::IndexSizeError };
        return true;
    }

    virtual void detachItems() { }
    virtual ItemType at(unsigned index) const = 0;
    virtual ItemType insert(unsigned index, ItemType&&) = 0;
    virtual ItemType replace(unsigned index, ItemType&&) = 0;
    virtual ItemType remove(unsigned index) = 0;
    virtual ItemType append(ItemType&&) = 0;

    Vector<ItemType> m_items;
};

}
