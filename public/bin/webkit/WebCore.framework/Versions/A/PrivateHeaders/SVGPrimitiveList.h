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

#include "SVGList.h"

namespace WebCore {

template<typename PropertyType>
class SVGPrimitiveList : public SVGList<PropertyType> {
protected:
    using Base = SVGList<PropertyType>;
    using Base::Base;
    using Base::size;
    using Base::m_items;

    PropertyType at(unsigned index) const override
    {
        ASSERT(index < size());
        return m_items.at(index);
    }

    PropertyType insert(unsigned index, PropertyType&& newItem) override
    {
        ASSERT(index <= size());
        m_items.insert(index, WTFMove(newItem));
        return at(index);
    }

    PropertyType replace(unsigned index, PropertyType&& newItem) override
    {
        ASSERT(index < size());
        m_items.at(index) = WTFMove(newItem);
        return at(index);
    }

    PropertyType remove(unsigned index) override
    {
        ASSERT(index < size());
        PropertyType item = at(index);
        m_items.remove(index);
        return item;
    }

    PropertyType append(PropertyType&& newItem) override
    {
        m_items.append(WTFMove(newItem));
        return at(size() - 1);
    }
};

}
