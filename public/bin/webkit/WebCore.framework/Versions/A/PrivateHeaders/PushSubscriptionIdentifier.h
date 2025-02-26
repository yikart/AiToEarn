/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

#include <wtf/HashTraits.h>
#include <wtf/Hasher.h>
#include <wtf/ObjectIdentifier.h>
#include <wtf/UUID.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

enum class PushSubscriptionIdentifierType { };
using PushSubscriptionIdentifier = ObjectIdentifier<PushSubscriptionIdentifierType>;

struct PushSubscriptionSetIdentifier {
    String bundleIdentifier;
    String pushPartition;
    Markable<WTF::UUID> dataStoreIdentifier;

    bool operator==(const PushSubscriptionSetIdentifier&) const;
    void add(Hasher&, const PushSubscriptionSetIdentifier&);
    bool isHashTableDeletedValue() const;

    PushSubscriptionSetIdentifier isolatedCopy() const &;
    PushSubscriptionSetIdentifier isolatedCopy() &&;

    WEBCORE_EXPORT String debugDescription() const;
};

WEBCORE_EXPORT String makePushTopic(const PushSubscriptionSetIdentifier&, const String& scope);

inline bool PushSubscriptionSetIdentifier::operator==(const PushSubscriptionSetIdentifier& other) const
{
    // Treat null and empty strings as empty strings for the purposes of hashing and comparison. The
    // reason for this is that null and empty strings are stored as empty strings in PushDatabase
    // (the columns are marked NOT NULL). We want to be able to compare instances that use null
    // strings with instances deserialized from the database that use empty strings.
    auto makeNotNull = [](const String& s) -> const String& {
        return s.isNull() ? emptyString() : s;
    };
    return makeNotNull(bundleIdentifier) == makeNotNull(other.bundleIdentifier) && makeNotNull(pushPartition) == makeNotNull(other.pushPartition) && dataStoreIdentifier == other.dataStoreIdentifier;
}

inline void add(Hasher& hasher, const PushSubscriptionSetIdentifier& sub)
{
    // Treat null and empty strings as empty strings for the purposes of hashing and comparison. See
    // the comment in operator== for more explanation.
    auto makeNotNull = [](const String& s) -> const String& {
        return s.isNull() ? emptyString() : s;
    };
    if (sub.dataStoreIdentifier)
        return add(hasher, makeNotNull(sub.bundleIdentifier), makeNotNull(sub.pushPartition), sub.dataStoreIdentifier.value());
    return add(hasher, makeNotNull(sub.bundleIdentifier), makeNotNull(sub.pushPartition));
}

inline bool PushSubscriptionSetIdentifier::isHashTableDeletedValue() const
{
    return dataStoreIdentifier && dataStoreIdentifier->isHashTableDeletedValue();
}

inline PushSubscriptionSetIdentifier PushSubscriptionSetIdentifier::isolatedCopy() const &
{
    return { bundleIdentifier.isolatedCopy(), pushPartition.isolatedCopy(), dataStoreIdentifier };
}

inline PushSubscriptionSetIdentifier PushSubscriptionSetIdentifier::isolatedCopy() &&
{
    return { WTFMove(bundleIdentifier).isolatedCopy(), WTFMove(pushPartition).isolatedCopy(), dataStoreIdentifier };
}

} // namespace WebCore

namespace WTF {

struct PushSubscriptionSetIdentifierHash {
    static unsigned hash(const WebCore::PushSubscriptionSetIdentifier& key) { return computeHash(key); }
    static bool equal(const WebCore::PushSubscriptionSetIdentifier& a, const WebCore::PushSubscriptionSetIdentifier& b) { return a == b; }
    static const bool safeToCompareToEmptyOrDeleted = true;
};

template<> struct DefaultHash<WebCore::PushSubscriptionSetIdentifier> : PushSubscriptionSetIdentifierHash { };

template<> struct HashTraits<WebCore::PushSubscriptionSetIdentifier> : GenericHashTraits<WebCore::PushSubscriptionSetIdentifier> {
    static const bool emptyValueIsZero = false;
    static WebCore::PushSubscriptionSetIdentifier emptyValue() { return { emptyString(), emptyString(), std::nullopt }; }

    static void constructDeletedValue(WebCore::PushSubscriptionSetIdentifier& slot) { new (NotNull, &slot) WebCore::PushSubscriptionSetIdentifier { emptyString(), emptyString(), WTF::UUID { HashTableDeletedValue } }; }
    static bool isDeletedValue(const WebCore::PushSubscriptionSetIdentifier& value) { return value.isHashTableDeletedValue(); }
};

} // namespace WTF
