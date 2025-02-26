 /*
 * Copyright (C) 2011, 2015, 2023 Apple Inc. All rights reserved.
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

#include "ProcessQualified.h"
#include <wtf/ArgumentCoder.h>
#include <wtf/Hasher.h>
#include <wtf/Markable.h>
#include <wtf/URL.h>

namespace WebCore {

class LocalFrame;
class SecurityOrigin;

enum class OpaqueOriginIdentifierType { };
using OpaqueOriginIdentifier = AtomicObjectIdentifier<OpaqueOriginIdentifierType>;

class SecurityOriginData {
public:
    struct Tuple {
        String protocol;
        String host;
        std::optional<uint16_t> port;

        friend bool operator==(const Tuple&, const Tuple&) = default;
        Tuple isolatedCopy() const & { return { protocol.isolatedCopy(), host.isolatedCopy(), port }; }
        Tuple isolatedCopy() && { return { WTFMove(protocol).isolatedCopy(), WTFMove(host).isolatedCopy(), port }; }
    };

    SecurityOriginData() = default;
    SecurityOriginData(const String& protocol, const String& host, std::optional<uint16_t> port)
        : m_data { Tuple { protocol, host, port } }
    {
        RELEASE_ASSERT_WITH_SECURITY_IMPLICATION(!isHashTableDeletedValue());
    }
    explicit SecurityOriginData(ProcessQualified<OpaqueOriginIdentifier> opaqueOriginIdentifier)
        : m_data(opaqueOriginIdentifier) { }
    explicit SecurityOriginData(std::variant<Tuple, ProcessQualified<OpaqueOriginIdentifier>>&& data)
        : m_data(WTFMove(data)) { }
    SecurityOriginData(WTF::HashTableDeletedValueType)
        : m_data { Tuple { WTF::HashTableDeletedValue, { }, { } } } { }
    
    WEBCORE_EXPORT static SecurityOriginData fromFrame(LocalFrame*);
    WEBCORE_EXPORT static SecurityOriginData fromURL(const URL&);
    WEBCORE_EXPORT static SecurityOriginData fromURLWithoutStrictOpaqueness(const URL&);

    static SecurityOriginData createOpaque()
    {
        return SecurityOriginData { ProcessQualified<OpaqueOriginIdentifier>::generate() };
    }

    WEBCORE_EXPORT Ref<SecurityOrigin> securityOrigin() const;

    // FIXME <rdar://9018386>: We should be sending more state across the wire than just the protocol,
    // host, and port.

    const String& protocol() const
    {
        return switchOn(m_data, [] (const Tuple& tuple) -> const String& {
            return tuple.protocol;
        }, [] (const ProcessQualified<OpaqueOriginIdentifier>&) -> const String& {
            return emptyString();
        });
    }
    const String& host() const
    {
        return switchOn(m_data, [] (const Tuple& tuple) -> const String&  {
            return tuple.host;
        }, [] (const ProcessQualified<OpaqueOriginIdentifier>&) -> const String& {
            return emptyString();
        });
    }
    std::optional<uint16_t> port() const
    {
        return switchOn(m_data, [] (const Tuple& tuple) -> std::optional<uint16_t> {
            return tuple.port;
        }, [] (const ProcessQualified<OpaqueOriginIdentifier>&) -> std::optional<uint16_t> {
            return std::nullopt;
        });
    }
    void setPort(std::optional<uint16_t> port)
    {
        switchOn(m_data, [port] (Tuple& tuple) {
            tuple.port = port;
        }, [] (const ProcessQualified<OpaqueOriginIdentifier>&) {
            ASSERT_NOT_REACHED();
        });
    }
    std::optional<ProcessQualified<OpaqueOriginIdentifier>> opaqueOriginIdentifier() const
    {
        return switchOn(m_data, [] (const Tuple&) {
            return std::optional<ProcessQualified<OpaqueOriginIdentifier>> { };
        }, [] (const ProcessQualified<OpaqueOriginIdentifier>& identifier) -> std::optional<ProcessQualified<OpaqueOriginIdentifier>> {
            return identifier;
        });
    }
    
    WEBCORE_EXPORT SecurityOriginData isolatedCopy() const &;
    WEBCORE_EXPORT SecurityOriginData isolatedCopy() &&;

    // Serialize the security origin to a string that could be used as part of
    // file names. This format should be used in storage APIs only.
    WEBCORE_EXPORT String databaseIdentifier() const;
    WEBCORE_EXPORT static std::optional<SecurityOriginData> fromDatabaseIdentifier(StringView);

    bool isNull() const
    {
        return switchOn(m_data, [] (const Tuple& tuple) {
            return tuple.protocol.isNull() && tuple.host.isNull() && tuple.port == std::nullopt;
        }, [] (const ProcessQualified<OpaqueOriginIdentifier>&) {
            return false;
        });
    }
    bool isOpaque() const
    {
        return std::holds_alternative<ProcessQualified<OpaqueOriginIdentifier>>(m_data);
    }

    bool isHashTableDeletedValue() const
    {
        return switchOn(m_data, [] (const Tuple& tuple) {
            return tuple.protocol.isHashTableDeletedValue();
        }, [] (const ProcessQualified<OpaqueOriginIdentifier>&) {
            return false;
        });
    }
    
    WEBCORE_EXPORT String toString() const;

    WEBCORE_EXPORT URL toURL() const;

#if !LOG_DISABLED
    String debugString() const { return toString(); }
#endif

    static bool shouldTreatAsOpaqueOrigin(const URL&);
    
    const std::variant<Tuple, ProcessQualified<OpaqueOriginIdentifier>>& data() const { return m_data; }
private:
    std::variant<Tuple, ProcessQualified<OpaqueOriginIdentifier>> m_data;
};

WEBCORE_EXPORT bool operator==(const SecurityOriginData&, const SecurityOriginData&);

inline void add(Hasher& hasher, const SecurityOriginData& data)
{
    add(hasher, data.data());
}

inline void add(Hasher& hasher, const SecurityOriginData::Tuple& tuple)
{
    add(hasher, tuple.protocol, tuple.host, tuple.port);
}

struct SecurityOriginDataHashTraits : SimpleClassHashTraits<SecurityOriginData> {
    static const bool hasIsEmptyValueFunction = true;
    static const bool emptyValueIsZero = false;
    static bool isEmptyValue(const SecurityOriginData& data) { return data.isNull(); }
};

struct SecurityOriginDataHash {
    static unsigned hash(const SecurityOriginData& data) { return computeHash(data); }
    static unsigned hash(const std::optional<SecurityOriginData>& data) { return computeHash(data); }
    static bool equal(const SecurityOriginData& a, const SecurityOriginData& b) { return a == b; }
    static bool equal(const std::optional<SecurityOriginData>& a, const std::optional<SecurityOriginData>& b) { return a == b; }
    static const bool safeToCompareToEmptyOrDeleted = false;
};

struct SecurityOriginDataMarkableTraits {
    static bool isEmptyValue(const SecurityOriginData& value) { return value.isNull(); }
    static SecurityOriginData emptyValue() { return { }; }
};
} // namespace WebCore

namespace WTF {

template<> struct HashTraits<WebCore::SecurityOriginData> : WebCore::SecurityOriginDataHashTraits { };
template<> struct DefaultHash<WebCore::SecurityOriginData> : WebCore::SecurityOriginDataHash { };
template<> struct DefaultHash<std::optional<WebCore::SecurityOriginData>> : WebCore::SecurityOriginDataHash { };

} // namespace WTF
