/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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
#include <wtf/text/WTFString.h>

namespace WebCore {

struct CookieChangeSubscription {
    String name;
    String url;

    CookieChangeSubscription() = default;

    CookieChangeSubscription(String&& name, String&& url)
        : name(WTFMove(name))
        , url(WTFMove(url))
    { }

    explicit CookieChangeSubscription(WTF::HashTableDeletedValueType deletedValue)
        : name(deletedValue)
    { }

    bool operator==(const CookieChangeSubscription& other) const = default;

    bool isHashTableDeletedValue() const { return name.isHashTableDeletedValue(); }
};

} // namespace WebCore

namespace WTF {

struct CookieChangeSubscriptionHash {
    static unsigned hash(const WebCore::CookieChangeSubscription& subscription)
    {
        return computeHash(subscription.name, subscription.url);
    }

    static bool equal(const WebCore::CookieChangeSubscription& a, const WebCore::CookieChangeSubscription& b)
    {
        return a == b;
    }

    static const bool safeToCompareToEmptyOrDeleted = false;
};

template<typename T> struct DefaultHash;
template<> struct DefaultHash<WebCore::CookieChangeSubscription> : CookieChangeSubscriptionHash { };

template<> struct HashTraits<WebCore::CookieChangeSubscription> : SimpleClassHashTraits<WebCore::CookieChangeSubscription> {
    static const bool emptyValueIsZero = false;
    static const bool hasIsEmptyValueFunction = false;
};

} // namespace WTF
