/*
 * Copyright (C) 2012 Apple Inc. All rights reserved.
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

#pragma once

#include "CacheableIdentifier.h"
#include "Identifier.h"
#include "JSGlobalObjectFunctions.h"
#include "PrivateName.h"
#include <wtf/dtoa.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

class PropertyName {
public:
    PropertyName(UniquedStringImpl* propertyName)
        : m_impl(propertyName)
    {
    }

    PropertyName(const Identifier& propertyName)
        : PropertyName(propertyName.impl())
    {
    }

    PropertyName(const CacheableIdentifier& propertyName)
        : PropertyName(propertyName.uid())
    {
    }

    PropertyName(const PrivateName& propertyName)
        : m_impl(&propertyName.uid())
    {
        ASSERT(m_impl);
        ASSERT(m_impl->isSymbol());
    }

    bool isNull() const { return !m_impl; }

    bool isSymbol() const
    {
        return m_impl && m_impl->isSymbol();
    }

    bool isPrivateName() const
    {
        return isSymbol() && static_cast<const SymbolImpl*>(m_impl)->isPrivate();
    }

    UniquedStringImpl* uid() const
    {
        return m_impl;
    }

    AtomStringImpl* publicName() const
    {
        return (!m_impl || m_impl->isSymbol()) ? nullptr : static_cast<AtomStringImpl*>(m_impl);
    }

    void dump(PrintStream& out) const
    {
        if (m_impl)
            out.print(m_impl);
        else
            out.print("<null property name>");
    }

private:
    UniquedStringImpl* m_impl;
};
static_assert(sizeof(PropertyName) == sizeof(UniquedStringImpl*), "UniquedStringImpl* and PropertyName should be compatible to invoke easily from JIT code.");

inline bool operator==(PropertyName a, const Identifier& b)
{
    return a.uid() == b.impl();
}

inline bool operator==(const Identifier& a, PropertyName b)
{
    return a.impl() == b.uid();
}

inline bool operator==(PropertyName a, PropertyName b)
{
    return a.uid() == b.uid();
}

inline bool operator==(PropertyName a, const char* b)
{
    return equal(a.uid(), b);
}

ALWAYS_INLINE std::optional<uint32_t> parseIndex(PropertyName propertyName)
{
    auto uid = propertyName.uid();
    if (!uid)
        return std::nullopt;
    if (uid->isSymbol())
        return std::nullopt;
    return parseIndex(*uid);
}

template<typename CharacterType>
ALWAYS_INLINE std::optional<bool> fastIsCanonicalNumericIndexString(std::span<const CharacterType> characters)
{
    auto* rawCharacters = characters.data();
    auto length = characters.size();
    ASSERT(length >= 1);
    auto first = rawCharacters[0];
    if (length == 1)
        return isASCIIDigit(first);
    auto second = rawCharacters[1];
    if (first == '-') {
        // -Infinity case should go to the slow path. -NaN cannot exist since it becomes NaN.
        if (!isASCIIDigit(second) && (length != strlen("-Infinity") || second != 'I'))
            return false;
        if (length == 2) // Including -0, and it should be accepted.
            return true;
    } else if (!isASCIIDigit(first)) {
        // Infinity and NaN should go to the slow path.
        if (!(length == strlen("Infinity") && first == 'I') && !(length == strlen("NaN") && first == 'N'))
            return false;
    }
    return std::nullopt;
}

// https://www.ecma-international.org/ecma-262/9.0/index.html#sec-canonicalnumericindexstring
ALWAYS_INLINE bool isCanonicalNumericIndexString(UniquedStringImpl* propertyName)
{
    if (!propertyName)
        return false;
    if (propertyName->isSymbol())
        return false;
    if (!propertyName->length())
        return false;

    auto fastResult = propertyName->is8Bit()
        ? fastIsCanonicalNumericIndexString(propertyName->span8())
        : fastIsCanonicalNumericIndexString(propertyName->span16());
    if (fastResult)
        return *fastResult;

    double index = jsToNumber(propertyName);
    NumberToStringBuffer buffer;
    auto span = WTF::numberToStringAndSize(index, buffer);
    return equal(propertyName, byteCast<LChar>(span));
}

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
