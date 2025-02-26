/*
 * Copyright (C) 2015 Yusuke Suzuki <utatane.tea@gmail.com>.
 * Copyright (C) 2019-2023 Apple Inc. All rights reserved.
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

#include <limits>
#include <wtf/Vector.h>
#include <wtf/text/StringHash.h>
#include <wtf/text/WTFString.h>

namespace JSC {

class TemplateObjectDescriptorTable;

class TemplateObjectDescriptor : public RefCounted<TemplateObjectDescriptor> {
public:
    typedef Vector<String, 4> StringVector;
    typedef Vector<std::optional<String>, 4> OptionalStringVector;

    enum DeletedValueTag { DeletedValue };
    TemplateObjectDescriptor(DeletedValueTag);
    enum EmptyValueTag { EmptyValue };
    TemplateObjectDescriptor(EmptyValueTag);

    bool isDeletedValue() const { return m_rawStrings.isEmpty() && m_hash == std::numeric_limits<unsigned>::max(); }

    bool isEmptyValue() const { return m_rawStrings.isEmpty() && !m_hash; }

    unsigned hash() const { return m_hash; }

    const StringVector& rawStrings() const { return m_rawStrings; }
    const OptionalStringVector& cookedStrings() const { return m_cookedStrings; }

    bool operator==(const TemplateObjectDescriptor& other) const { return m_hash == other.m_hash && m_rawStrings == other.m_rawStrings; }

    struct Hasher {
        static unsigned hash(const TemplateObjectDescriptor& key) { return key.hash(); }
        static bool equal(const TemplateObjectDescriptor& a, const TemplateObjectDescriptor& b) { return a == b; }
        static constexpr bool safeToCompareToEmptyOrDeleted = false;
    };

    static unsigned calculateHash(const StringVector& rawStrings);
    ~TemplateObjectDescriptor();

    static Ref<TemplateObjectDescriptor> create(StringVector&& rawStrings, OptionalStringVector&& cookedStrings)
    {
        return adoptRef(*new TemplateObjectDescriptor(WTFMove(rawStrings), WTFMove(cookedStrings)));
    }

private:
    TemplateObjectDescriptor(StringVector&& rawStrings, OptionalStringVector&& cookedStrings);

    StringVector m_rawStrings;
    OptionalStringVector m_cookedStrings;
    unsigned m_hash { 0 };
};

inline TemplateObjectDescriptor::TemplateObjectDescriptor(StringVector&& rawStrings, OptionalStringVector&& cookedStrings)
    : m_rawStrings(WTFMove(rawStrings))
    , m_cookedStrings(WTFMove(cookedStrings))
    , m_hash(calculateHash(m_rawStrings))
{
}

inline TemplateObjectDescriptor::TemplateObjectDescriptor(DeletedValueTag)
    : m_hash(std::numeric_limits<unsigned>::max())
{
}

inline TemplateObjectDescriptor::TemplateObjectDescriptor(EmptyValueTag)
    : m_hash(0)
{
}

inline unsigned TemplateObjectDescriptor::calculateHash(const StringVector& rawStrings)
{
    SuperFastHash hasher;
    for (const String& string : rawStrings) {
        if (string.is8Bit())
            hasher.addCharacters(string.span8());
        else
            hasher.addCharacters(string.span16());
    }
    return hasher.hash();
}

} // namespace JSC

namespace WTF {
template<typename> struct DefaultHash;

template<> struct DefaultHash<JSC::TemplateObjectDescriptor> : JSC::TemplateObjectDescriptor::Hasher { };

template<> struct HashTraits<JSC::TemplateObjectDescriptor> : CustomHashTraits<JSC::TemplateObjectDescriptor> {
};

} // namespace WTF
