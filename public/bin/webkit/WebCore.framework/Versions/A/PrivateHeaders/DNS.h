/*
 * Copyright (C) 2008 Collin Jackson  <collinj@webkit.org>
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
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
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

#include <optional>
#include <variant>
#include <wtf/Forward.h>
#include <wtf/HashTraits.h>
#include <wtf/StdLibExtras.h>

#if OS(WINDOWS)
#include <winsock2.h>
#include <ws2tcpip.h>
#else
#include <netinet/in.h>
#endif

namespace WebCore {

class IPAddress {
public:
    explicit IPAddress(const struct in_addr& address)
        : m_address(address)
    {
    }

    explicit IPAddress(const struct in6_addr& address)
        : m_address(address)
    {
    }

    explicit IPAddress(WTF::HashTableEmptyValueType)
        : m_address(WTF::HashTableEmptyValue)
    {
    }

    bool isHashTableEmptyValue() const { return std::holds_alternative<WTF::HashTableEmptyValueType>(m_address); }

    WEBCORE_EXPORT IPAddress isolatedCopy() const;
    WEBCORE_EXPORT unsigned matchingNetMaskLength(const IPAddress& other) const;
    WEBCORE_EXPORT static std::optional<IPAddress> fromString(const String&);

    bool isIPv4() const { return std::holds_alternative<struct in_addr>(m_address); }
    bool isIPv6() const { return std::holds_alternative<struct in6_addr>(m_address); }
    bool containsOnlyZeros() const;
    WEBCORE_EXPORT bool isLoopback() const;

    const struct in_addr& ipv4Address() const { return std::get<struct in_addr>(m_address); }
    const struct in6_addr& ipv6Address() const { return std::get<struct in6_addr>(m_address); }

    enum class ComparisonResult : uint8_t {
        CannotCompare,
        Less,
        Equal,
        Greater
    };

    ComparisonResult compare(const IPAddress& other) const
    {
        auto comparisonResult = [](int result) {
            if (!result)
                return ComparisonResult::Equal;
            if (result < 0)
                return ComparisonResult::Less;
            return ComparisonResult::Greater;
        };

        if (isIPv4() && other.isIPv4())
            return comparisonResult(compareSpans(asByteSpan(ipv4Address()), asByteSpan(other.ipv4Address())));

        if (isIPv6() && other.isIPv6())
            return comparisonResult(compareSpans(asByteSpan(ipv6Address()), asByteSpan(other.ipv6Address())));

        return ComparisonResult::CannotCompare;
    }

    bool operator<(const IPAddress& other) const { return compare(other) == ComparisonResult::Less; }
    bool operator>(const IPAddress& other) const { return compare(other) == ComparisonResult::Greater; }
    bool operator==(const IPAddress& other) const { return compare(other) == ComparisonResult::Equal; }

private:
    std::variant<WTF::HashTableEmptyValueType, struct in_addr, struct in6_addr> m_address;
};

enum class DNSError { Unknown, CannotResolve, Cancelled };

using DNSAddressesOrError = Expected<Vector<IPAddress>, DNSError>;
using DNSCompletionHandler = CompletionHandler<void(DNSAddressesOrError&&)>;

WEBCORE_EXPORT void prefetchDNS(const String& hostname);
WEBCORE_EXPORT void resolveDNS(const String& hostname, uint64_t identifier, DNSCompletionHandler&&);
WEBCORE_EXPORT void stopResolveDNS(uint64_t identifier);
WEBCORE_EXPORT bool isIPAddressDisallowed(const URL&);

} // namespace WebCore

namespace WTF {

template<> struct HashTraits<WebCore::IPAddress> : GenericHashTraits<WebCore::IPAddress> {
    static WebCore::IPAddress emptyValue() { return WebCore::IPAddress { WTF::HashTableEmptyValue }; }
    static bool isEmptyValue(const WebCore::IPAddress& value) { return value.isHashTableEmptyValue(); }
};

} // namespace WTF
