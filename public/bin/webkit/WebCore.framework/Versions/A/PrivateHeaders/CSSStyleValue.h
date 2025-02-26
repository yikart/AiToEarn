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

#include "CSSPropertyNames.h"
#include "CSSValue.h"
#include "ScriptWrappable.h"
#include <wtf/OptionSet.h>
#include <wtf/RefCounted.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

template<typename T> class ExceptionOr;
struct CSSParserContext;
class Document;

enum class CSSStyleValueType : uint8_t {
    CSSStyleValue,
    CSSStyleImageValue,
    CSSTransformValue,
    CSSMathClamp,
    CSSMathInvert,
    CSSMathMin,
    CSSMathMax,
    CSSMathNegate,
    CSSMathProduct,
    CSSMathSum,
    CSSUnitValue,
    CSSUnparsedValue,
    CSSKeywordValue
};

inline bool isCSSNumericValue(CSSStyleValueType type)
{
    switch (type) {
    case CSSStyleValueType::CSSMathClamp:
    case CSSStyleValueType::CSSMathInvert:
    case CSSStyleValueType::CSSMathMin:
    case CSSStyleValueType::CSSMathMax:
    case CSSStyleValueType::CSSMathNegate:
    case CSSStyleValueType::CSSMathProduct:
    case CSSStyleValueType::CSSMathSum:
    case CSSStyleValueType::CSSUnitValue:
        return true;
    case CSSStyleValueType::CSSStyleValue:
    case CSSStyleValueType::CSSStyleImageValue:
    case CSSStyleValueType::CSSTransformValue:
    case CSSStyleValueType::CSSUnparsedValue:
    case CSSStyleValueType::CSSKeywordValue:
        break;
    }
    return false;
}

inline bool isCSSMathValue(CSSStyleValueType type)
{
    switch (type) {
    case CSSStyleValueType::CSSMathClamp:
    case CSSStyleValueType::CSSMathInvert:
    case CSSStyleValueType::CSSMathMin:
    case CSSStyleValueType::CSSMathMax:
    case CSSStyleValueType::CSSMathNegate:
    case CSSStyleValueType::CSSMathProduct:
    case CSSStyleValueType::CSSMathSum:
        return true;
    case CSSStyleValueType::CSSUnitValue:
    case CSSStyleValueType::CSSStyleValue:
    case CSSStyleValueType::CSSStyleImageValue:
    case CSSStyleValueType::CSSTransformValue:
    case CSSStyleValueType::CSSUnparsedValue:
    case CSSStyleValueType::CSSKeywordValue:
        break;
    }
    return false;
}

enum class SerializationArguments : uint8_t {
    Nested = 0x1,
    WithoutParentheses = 0x2,
};

class CSSStyleValue : public RefCounted<CSSStyleValue>, public ScriptWrappable {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(CSSStyleValue);
public:
    String toString() const;
    virtual void serialize(StringBuilder&, OptionSet<SerializationArguments> = { }) const;

IGNORE_GCC_WARNINGS_BEGIN("mismatched-new-delete")
    // https://webkit.org/b/241516
    virtual ~CSSStyleValue() = default;
IGNORE_GCC_WARNINGS_END

    virtual CSSStyleValueType getType() const { return CSSStyleValueType::CSSStyleValue; }

    static ExceptionOr<Ref<CSSStyleValue>> parse(const Document&, const AtomString&, const String&);
    static ExceptionOr<Vector<Ref<CSSStyleValue>>> parseAll(const Document&, const AtomString&, const String&);

    static Ref<CSSStyleValue> create(RefPtr<CSSValue>&&, String&& = String());
    static Ref<CSSStyleValue> create();

    virtual RefPtr<CSSValue> toCSSValue() const { return m_propertyValue; }
    virtual RefPtr<CSSValue> toCSSValueWithProperty(CSSPropertyID) const { return toCSSValue(); }

protected:
    CSSStyleValue(RefPtr<CSSValue>&&, String&& = String());
    CSSStyleValue() = default;
    
    String m_customPropertyName;
    RefPtr<CSSValue> m_propertyValue;
};

} // namespace WebCore
