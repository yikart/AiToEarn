/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
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

#include "CSSCalcTree.h"
#include "CSSNumericType.h"
#include "CSSStyleValue.h"
#include <variant>
#include <wtf/HashMap.h>

namespace WebCore {

class CSSNumericValue;
class CSSUnitValue;
class CSSMathSum;

template<typename> class ExceptionOr;

using CSSNumberish = std::variant<double, RefPtr<CSSNumericValue>>;

class CSSNumericValue : public CSSStyleValue {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(CSSNumericValue);
public:

    ExceptionOr<Ref<CSSNumericValue>> add(FixedVector<CSSNumberish>&&);
    ExceptionOr<Ref<CSSNumericValue>> sub(FixedVector<CSSNumberish>&&);
    ExceptionOr<Ref<CSSNumericValue>> mul(FixedVector<CSSNumberish>&&);
    ExceptionOr<Ref<CSSNumericValue>> div(FixedVector<CSSNumberish>&&);
    ExceptionOr<Ref<CSSNumericValue>> min(FixedVector<CSSNumberish>&&);
    ExceptionOr<Ref<CSSNumericValue>> max(FixedVector<CSSNumberish>&&);
    
    bool equals(FixedVector<CSSNumberish>&&);
    
    ExceptionOr<Ref<CSSUnitValue>> to(String&&);
    ExceptionOr<Ref<CSSUnitValue>> to(CSSUnitType);
    ExceptionOr<Ref<CSSMathSum>> toSum(FixedVector<String>&&);

    const CSSNumericType& type() const { return m_type; }
    
    static ExceptionOr<Ref<CSSNumericValue>> parse(Document&, String&&);
    static Ref<CSSNumericValue> rectifyNumberish(CSSNumberish&&);

    // https://drafts.css-houdini.org/css-typed-om/#sum-value-value
    using UnitMap = UncheckedKeyHashMap<CSSUnitType, int, WTF::IntHash<CSSUnitType>, WTF::StrongEnumHashTraits<CSSUnitType>>;
    struct Addend {
        double value;
        UnitMap units;
    };
    using SumValue = Vector<Addend>;
    virtual std::optional<SumValue> toSumValue() const = 0;
    virtual bool equals(const CSSNumericValue&) const = 0;

    virtual std::optional<CSSCalc::Child> toCalcTreeNode() const = 0;

    static ExceptionOr<Ref<CSSNumericValue>> reifyMathExpression(const CSSCalc::Tree&);
    static ExceptionOr<Ref<CSSNumericValue>> reifyMathExpression(const CSSCalc::Child&);
    static ExceptionOr<Ref<CSSNumericValue>> reifyMathExpression(const CSSCalc::ChildOrNone&);

protected:
    ExceptionOr<Ref<CSSNumericValue>> addInternal(Vector<Ref<CSSNumericValue>>&&);
    ExceptionOr<Ref<CSSNumericValue>> multiplyInternal(Vector<Ref<CSSNumericValue>>&&);
    template<typename T> Vector<Ref<CSSNumericValue>> prependItemsOfTypeOrThis(Vector<Ref<CSSNumericValue>>&&);

    CSSNumericValue(CSSNumericType type = { })
        : m_type(WTFMove(type)) { }

    CSSNumericType m_type;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::CSSNumericValue)
    static bool isType(const WebCore::CSSStyleValue& styleValue) { return isCSSNumericValue(styleValue.getType()); }
SPECIALIZE_TYPE_TRAITS_END()
