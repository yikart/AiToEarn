/*
 * Copyright (C) 2011-2024 Apple Inc. All rights reserved.
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

#include "CompositeOperation.h"
#include "FilterOperation.h"
#include <algorithm>
#include <wtf/ArgumentCoder.h>
#include <wtf/Ref.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>

namespace WebCore {

struct BlendingContext;

class FilterOperations {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(FilterOperations, WEBCORE_EXPORT);
public:
    using const_iterator = Vector<Ref<FilterOperation>>::const_iterator;
    using const_reverse_iterator = Vector<Ref<FilterOperation>>::const_reverse_iterator;
    using value_type = Vector<Ref<FilterOperation>>::value_type;

    FilterOperations() = default;
    WEBCORE_EXPORT explicit FilterOperations(Vector<Ref<FilterOperation>>&&);

    WEBCORE_EXPORT bool operator==(const FilterOperations&) const;

    FilterOperations clone() const
    {
        return FilterOperations { m_operations.map([](const auto& op) { return op->clone(); }) };
    }

    const_iterator begin() const { return m_operations.begin(); }
    const_iterator end() const { return m_operations.end(); }
    const_reverse_iterator rbegin() const { return m_operations.rbegin(); }
    const_reverse_iterator rend() const { return m_operations.rend(); }

    bool isEmpty() const { return m_operations.isEmpty(); }
    size_t size() const { return m_operations.size(); }
    const FilterOperation* at(size_t index) const { return index < m_operations.size() ? m_operations[index].ptr() : nullptr; }

    const Ref<FilterOperation>& operator[](size_t i) const { return m_operations[i]; }
    const Ref<FilterOperation>& first() const { return m_operations.first(); }
    const Ref<FilterOperation>& last() const { return m_operations.last(); }

    bool operationsMatch(const FilterOperations&) const;

    bool hasOutsets() const { return !outsets().isZero(); }
    IntOutsets outsets() const;

    bool hasFilterThatAffectsOpacity() const;
    bool hasFilterThatMovesPixels() const;
    bool hasFilterThatShouldBeRestrictedBySecurityOrigin() const;

    template<FilterOperation::Type Type>
    bool hasFilterOfType() const;

    bool hasReferenceFilter() const;
    bool isReferenceFilter() const;

    bool transformColor(Color&) const;
    bool inverseTransformColor(Color&) const;

    WEBCORE_EXPORT bool canInterpolate(const FilterOperations&, CompositeOperation) const;
    WEBCORE_EXPORT FilterOperations blend(const FilterOperations&, const BlendingContext&) const;

private:
    friend struct IPC::ArgumentCoder<FilterOperations, void>;
    WEBCORE_EXPORT friend WTF::TextStream& operator<<(WTF::TextStream&, const FilterOperations&);

    Vector<Ref<FilterOperation>> m_operations;
};

template<FilterOperation::Type type> bool FilterOperations::hasFilterOfType() const
{
    return std::ranges::any_of(m_operations, [](auto& op) { return op->type() == type; });
}

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const FilterOperations&);

} // namespace WebCore
