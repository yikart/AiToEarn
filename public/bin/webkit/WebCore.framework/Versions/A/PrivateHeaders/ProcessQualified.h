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

#include "ProcessIdentifier.h"
#include <wtf/Hasher.h>
#include <wtf/Markable.h>
#include <wtf/text/MakeString.h>
#include <wtf/text/TextStream.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace WebCore {

template <typename T>
class ProcessQualified {
public:
    // This class is used when a single process retains objects representing things in multiple other processes.
    // (E.g. resources in the GPU process.)
    // Generally, objects are identified uniquely per process, but if multiple processes share them to a single
    // process, the single process should distinguish between them by augmenting the objects with the
    // ProcessIdentifier of the process which created them.

    ProcessQualified(T&& object, ProcessIdentifier processIdentifier)
        : m_object(WTFMove(object))
        , m_processIdentifier(processIdentifier)
    {
    }

    ProcessQualified(const T& object, ProcessIdentifier processIdentifier)
        : m_object(object)
        , m_processIdentifier(processIdentifier)
    {
    }

    ProcessQualified(WTF::HashTableDeletedValueType)
        : m_object(WTF::HashTableDeletedValue)
        , m_processIdentifier(WTF::HashTableDeletedValue)
    {
    }

    operator bool() const
    {
        return static_cast<bool>(m_object);
    }

    const T& object() const
    {
        return m_object;
    }

    ProcessIdentifier processIdentifier() const
    {
        return m_processIdentifier;
    }

    bool isHashTableDeletedValue() const
    {
        return m_processIdentifier.isHashTableDeletedValue();
    }

    friend bool operator==(const ProcessQualified&, const ProcessQualified&) = default;

    static ProcessQualified generate() { return { T::generate(), Process::identifier() }; }

    String toString() const { return makeString(m_processIdentifier.toUInt64(), '-', m_object.toUInt64()); }

    struct MarkableTraits {
        static bool isEmptyValue(const ProcessQualified& identifier) { return T::MarkableTraits::isEmptyValue(identifier.object()); }
        static constexpr ProcessQualified emptyValue() { return { T::MarkableTraits::emptyValue(), ProcessIdentifier::MarkableTraits::emptyValue() }; }
    };

private:
    T m_object;
    ProcessIdentifier m_processIdentifier;
};

template<typename T>
bool operator>(const ProcessQualified<T>& a, const ProcessQualified<T>& b)
{
    return a.object() > b.object();
}

template<typename T>
bool operator>=(const ProcessQualified<T>& a, const ProcessQualified<T>& b)
{
    return a.object() >= b.object();
}

template<typename T>
bool operator<(const ProcessQualified<T>& a, const ProcessQualified<T>& b)
{
    return a.object() < b.object();
}

template<typename T>
bool operator<=(const ProcessQualified<T>& a, const ProcessQualified<T>& b)
{
    return a.object() <= b.object();
}

template <typename T>
inline TextStream& operator<<(TextStream& ts, const ProcessQualified<T>& processQualified)
{
    ts << "ProcessQualified(" << processQualified.object() << ", " << processQualified.processIdentifier() << ')';
    return ts;
}

template <typename T>
inline void add(Hasher& hasher, const ProcessQualified<T>& processQualified)
{
    add(hasher, processQualified.object());
    add(hasher, processQualified.processIdentifier());
}

} // namespace WebCore

namespace WTF {

template<typename T> struct DefaultHash;
template<typename T> struct DefaultHash<WebCore::ProcessQualified<T>> {
    static unsigned hash(const WebCore::ProcessQualified<T>& processQualified)
    {
        return computeHash(processQualified);
    }

    static bool equal(const WebCore::ProcessQualified<T>& a, const WebCore::ProcessQualified<T>& b)
    {
        return a == b;
    }

    static const bool safeToCompareToEmptyOrDeleted = DefaultHash<T>::safeToCompareToEmptyOrDeleted;
};

template<typename T> struct HashTraits<WebCore::ProcessQualified<T>> : SimpleClassHashTraits<WebCore::ProcessQualified<T>> {
    static constexpr bool emptyValueIsZero = HashTraits<T>::emptyValueIsZero;
    static WebCore::ProcessQualified<T> emptyValue() { return { HashTraits<T>::emptyValue(), HashTraits<WebCore::ProcessIdentifier>::emptyValue() }; }
    static bool isEmptyValue(const WebCore::ProcessQualified<T>& value) { return value.object().isHashTableEmptyValue(); }
};

class ProcessQualifiedStringTypeAdapter {
public:
    unsigned length() const { return lengthOfIntegerAsString(m_processIdentifier) + lengthOfIntegerAsString(m_objectIdentifier) + 1; }
    bool is8Bit() const { return true; }
    template<typename CharacterType> void writeTo(std::span<CharacterType> destination) const
    {
        auto processIdentifierLength = lengthOfIntegerAsString(m_processIdentifier);
        writeIntegerToBuffer(m_processIdentifier, destination);
        destination[processIdentifierLength] = '-';
        writeIntegerToBuffer(m_objectIdentifier, destination.subspan(processIdentifierLength + 1));
    }
protected:
    explicit ProcessQualifiedStringTypeAdapter(uint64_t processIdentifier, uint64_t objectIdentifier)
        : m_processIdentifier(processIdentifier)
        , m_objectIdentifier(objectIdentifier)
        { }
private:
    uint64_t m_processIdentifier;
    uint64_t m_objectIdentifier;
};

template<typename T>
class StringTypeAdapter<WebCore::ProcessQualified<T>, void> : public ProcessQualifiedStringTypeAdapter {
public:
    explicit StringTypeAdapter(const WebCore::ProcessQualified<T>& processQualified)
        : ProcessQualifiedStringTypeAdapter(processQualified.processIdentifier().toUInt64(), processQualified.object().toUInt64()) { }
};

} // namespace WTF

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
