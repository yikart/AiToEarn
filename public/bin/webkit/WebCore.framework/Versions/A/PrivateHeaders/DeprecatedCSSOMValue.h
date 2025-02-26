/*
 * Copyright (C) 2016-2022 Apple Inc. All rights reserved.
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

#include "CSSStyleDeclaration.h"
#include "CSSValue.h"
#include "ExceptionOr.h"
#include <wtf/RefCountedAndCanMakeWeakPtr.h>
#include <wtf/WeakPtr.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class DeprecatedCSSOMValue : public RefCountedAndCanMakeWeakPtr<DeprecatedCSSOMValue> {
public:
    // Exactly match the IDL. No reason to add anything if it's not in the IDL.
    enum Type : unsigned short {
        CSS_INHERIT = 0,
        CSS_PRIMITIVE_VALUE = 1,
        CSS_VALUE_LIST = 2,
        CSS_CUSTOM = 3
    };

    WEBCORE_EXPORT unsigned short cssValueType() const;

    WEBCORE_EXPORT String cssText() const;
    ExceptionOr<void> setCssText(const String&) { return { }; } // Will never implement.

    bool isBoxShadowValue() const { return classType() == ClassType::BoxShadow; }
    bool isComplexValue() const { return classType() == ClassType::Complex; }
    bool isFilterFunctionValue() const { return classType() == ClassType::FilterFunction; }
    bool isPrimitiveValue() const { return classType() == ClassType::Primitive; }
    bool isTextShadowValue() const { return classType() == ClassType::TextShadow; }
    bool isValueList() const { return classType() == ClassType::List; }

    CSSStyleDeclaration& owner() const { return m_owner; }

    // NOTE: This destructor is non-virtual for memory and performance reasons.
    // Don't go making it virtual again unless you know exactly what you're doing!
    ~DeprecatedCSSOMValue() = default;
    WEBCORE_EXPORT void operator delete(DeprecatedCSSOMValue*, std::destroying_delete_t);

protected:
    static const size_t ClassTypeBits = 3;
    enum class ClassType : uint8_t {
        BoxShadow,
        Complex,
        FilterFunction,
        List,
        Primitive,
        TextShadow
    };
    ClassType classType() const { return static_cast<ClassType>(m_classType); }

    DeprecatedCSSOMValue(ClassType classType, CSSStyleDeclaration& owner)
        : m_classType(enumToUnderlyingType(classType))
        , m_owner(owner)
    {
    }

protected:
    unsigned m_valueSeparator : CSSValue::ValueSeparatorBits;
    unsigned m_classType : ClassTypeBits; // ClassType
    
    Ref<CSSStyleDeclaration> m_owner;
};

class DeprecatedCSSOMComplexValue : public DeprecatedCSSOMValue {
public:
    static Ref<DeprecatedCSSOMComplexValue> create(Ref<const CSSValue> value, CSSStyleDeclaration& owner)
    {
        return adoptRef(*new DeprecatedCSSOMComplexValue(WTFMove(value), owner));
    }

    String cssText() const { return m_value->cssText(); }

    unsigned short cssValueType() const;

protected:
    DeprecatedCSSOMComplexValue(Ref<const CSSValue> value, CSSStyleDeclaration& owner)
        : DeprecatedCSSOMValue(ClassType::Complex, owner)
        , m_value(WTFMove(value))
    {
    }

private:
    Ref<const CSSValue> m_value;
};
    
} // namespace WebCore

#define SPECIALIZE_TYPE_TRAITS_CSSOM_VALUE(ToValueTypeName, predicate) \
SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::ToValueTypeName) \
static bool isType(const WebCore::DeprecatedCSSOMValue& value) { return value.predicate; } \
SPECIALIZE_TYPE_TRAITS_END()

SPECIALIZE_TYPE_TRAITS_CSSOM_VALUE(DeprecatedCSSOMComplexValue, isComplexValue())
