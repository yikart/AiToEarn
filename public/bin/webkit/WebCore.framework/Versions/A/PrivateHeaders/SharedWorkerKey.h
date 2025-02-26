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

#include "ClientOrigin.h"

namespace WebCore {

struct SharedWorkerKey {
    ClientOrigin origin;
    URL url;
    String name;

    friend bool operator==(const SharedWorkerKey&, const SharedWorkerKey&) = default;
};

inline void add(Hasher& hasher, const SharedWorkerKey& key)
{
    add(hasher, key.origin, key.url, key.name);
}

} // namespace WebCore

namespace WTF {

template<> struct DefaultHash<WebCore::SharedWorkerKey> {
    static unsigned hash(const WebCore::SharedWorkerKey& key) { return computeHash(key); }
    static bool equal(const WebCore::SharedWorkerKey& a, const WebCore::SharedWorkerKey& b) { return a == b; }
    static const bool safeToCompareToEmptyOrDeleted = false;
};

template<> struct HashTraits<WebCore::SharedWorkerKey> : GenericHashTraits<WebCore::SharedWorkerKey> {
    static constexpr bool emptyValueIsZero = false;
    static void constructDeletedValue(WebCore::SharedWorkerKey& slot) { new (NotNull, &slot.url) URL(WTF::HashTableDeletedValue); }
    static bool isDeletedValue(const WebCore::SharedWorkerKey& slot) { return slot.url.isHashTableDeletedValue(); }
};

} // namespace WTF
