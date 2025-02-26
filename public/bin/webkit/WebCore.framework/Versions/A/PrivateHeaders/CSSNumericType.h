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

#include "CSSNumericBaseType.h"
#include <optional>
#include <wtf/Markable.h>

namespace WebCore {

class CSSNumericValue;
enum class CSSUnitType : uint8_t;

// https://drafts.css-houdini.org/css-typed-om/#dom-cssnumericvalue-type
class CSSNumericType {
public:
    using BaseTypeStorage = Markable<int, IntegralMarkableTraits<int, std::numeric_limits<int>::min()>>;
    BaseTypeStorage length;
    BaseTypeStorage angle;
    BaseTypeStorage time;
    BaseTypeStorage frequency;
    BaseTypeStorage resolution;
    BaseTypeStorage flex;
    BaseTypeStorage percent;
    Markable<CSSNumericBaseType, EnumMarkableTraits<CSSNumericBaseType>> percentHint;

    static std::optional<CSSNumericType> create(CSSUnitType, int exponent = 1);
    friend bool operator==(const CSSNumericType&, const CSSNumericType&) = default;
    static std::optional<CSSNumericType> addTypes(const Vector<Ref<CSSNumericValue>>&);
    static std::optional<CSSNumericType> addTypes(CSSNumericType, CSSNumericType);
    static std::optional<CSSNumericType> multiplyTypes(const Vector<Ref<CSSNumericValue>>&);
    static std::optional<CSSNumericType> multiplyTypes(const CSSNumericType&, const CSSNumericType&);
    BaseTypeStorage& valueForType(CSSNumericBaseType);
    const BaseTypeStorage& valueForType(CSSNumericBaseType type) const { return const_cast<CSSNumericType*>(this)->valueForType(type); }
    void applyPercentHint(CSSNumericBaseType);
    size_t nonZeroEntryCount() const;

    template<CSSNumericBaseType type>
    bool matches() const
    {
        // https://drafts.css-houdini.org/css-typed-om/#cssnumericvalue-match
        return (type == CSSNumericBaseType::Percent || !percentHint)
            && nonZeroEntryCount() == 1
            && valueForType(type)
            && *valueForType(type);
    }

    bool matchesNumber() const
    {
        // https://drafts.css-houdini.org/css-typed-om/#cssnumericvalue-match
        return !nonZeroEntryCount() && !percentHint;
    }

    template<CSSNumericBaseType type>
    bool matchesTypeOrPercentage() const
    {
        return matches<type>() || matches<CSSNumericBaseType::Percent>();
    }

    String debugString() const;
};

} // namespace WebCore
