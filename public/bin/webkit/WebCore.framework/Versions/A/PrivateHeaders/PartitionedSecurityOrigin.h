/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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

#include "SecurityOrigin.h"
#include <wtf/HashTraits.h>
#include <wtf/Hasher.h>
#include <wtf/Ref.h>

namespace WebCore {

struct PartitionedSecurityOrigin {
    PartitionedSecurityOrigin(Ref<SecurityOrigin>&& topOrigin, Ref<SecurityOrigin>&& clientOrigin)
        : topOrigin(WTFMove(topOrigin))
        , clientOrigin(WTFMove(clientOrigin))
    { }

    PartitionedSecurityOrigin(WTF::HashTableDeletedValueType)
        : topOrigin(WTF::HashTableDeletedValue)
        , clientOrigin(WTF::HashTableDeletedValue)
    { }

    PartitionedSecurityOrigin(WTF::HashTableEmptyValueType)
        : topOrigin(WTF::HashTableEmptyValue)
        , clientOrigin(WTF::HashTableEmptyValue)
    { }

    bool isHashTableDeletedValue() const { return topOrigin.isHashTableDeletedValue(); }
    bool isHashTableEmptyValue() const { return topOrigin.isHashTableEmptyValue(); }

    PartitionedSecurityOrigin isolatedCopy() const { return { topOrigin->isolatedCopy(), clientOrigin->isolatedCopy() }; }

    Ref<SecurityOrigin> topOrigin;
    Ref<SecurityOrigin> clientOrigin;
};

inline bool operator==(const PartitionedSecurityOrigin& a, const PartitionedSecurityOrigin& b)
{
    return a.topOrigin->isSameOriginAs(b.topOrigin) && a.clientOrigin->isSameOriginAs(b.clientOrigin);
}

} // namespace WebCore

namespace WTF {

inline void add(Hasher& hasher, const WebCore::PartitionedSecurityOrigin& origin)
{
    add(hasher, origin.topOrigin.get(), origin.clientOrigin.get());
}

struct PartitionedSecurityOriginHash {
    static unsigned hash(const WebCore::PartitionedSecurityOrigin& origin) { return computeHash(origin); }
    static bool equal(const WebCore::PartitionedSecurityOrigin& a, const WebCore::PartitionedSecurityOrigin& b) { return a == b; }
    static constexpr bool safeToCompareToEmptyOrDeleted = false;
};

template<> struct DefaultHash<WebCore::PartitionedSecurityOrigin> : PartitionedSecurityOriginHash { };

template<> struct HashTraits<WebCore::PartitionedSecurityOrigin> : SimpleClassHashTraits<WebCore::PartitionedSecurityOrigin> {
    static constexpr bool emptyValueIsZero = true;
    static WebCore::PartitionedSecurityOrigin emptyValue() { return HashTableEmptyValue; }

    template <typename>
    static void constructEmptyValue(WebCore::PartitionedSecurityOrigin& slot)
    {
        new (NotNull, std::addressof(slot)) WebCore::PartitionedSecurityOrigin(HashTableEmptyValue);
    }

    static constexpr bool hasIsEmptyValueFunction = true;
    static bool isEmptyValue(const WebCore::PartitionedSecurityOrigin& value) { return value.isHashTableEmptyValue(); }

    using PeekType = std::optional<WebCore::PartitionedSecurityOrigin>;
    static PeekType peek(const WebCore::PartitionedSecurityOrigin& value) { return isEmptyValue(value) ? std::nullopt : std::optional { value }; }

    using TakeType = std::optional<WebCore::PartitionedSecurityOrigin>;
    static TakeType take(WebCore::PartitionedSecurityOrigin&& value) { return isEmptyValue(value) ? std::nullopt : std::optional { WTFMove(value) }; }
};

} // namespace WTF
