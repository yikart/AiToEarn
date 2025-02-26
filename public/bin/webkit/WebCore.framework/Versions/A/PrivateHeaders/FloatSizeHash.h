/*
 * Copyright (C) 2014 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#ifndef FloatSizeHash_h
#define FloatSizeHash_h

#include "FloatSize.h"
#include <wtf/HashSet.h>

namespace WTF {

template<> struct FloatHash<WebCore::FloatSize> {
    static unsigned hash(const WebCore::FloatSize& key) { return pairIntHash(DefaultHash<float>::hash(key.width()), DefaultHash<float>::hash(key.height())); }
    static bool equal(const WebCore::FloatSize& a, const WebCore::FloatSize& b) { return a == b; }
    static const bool safeToCompareToEmptyOrDeleted = true;
};

template<> struct DefaultHash<WebCore::FloatSize> : FloatHash<WebCore::FloatSize> { };

template<> struct HashTraits<WebCore::FloatSize> : GenericHashTraits<WebCore::FloatSize> {
    static const bool emptyValueIsZero = true;
    static void constructDeletedValue(WebCore::FloatSize& slot) { new (NotNull, &slot) WebCore::FloatSize(-1, -1); }
    static bool isDeletedValue(const WebCore::FloatSize& value) { return value.width() == -1 && value.height() == -1; }
};

} // namespace WTF

#endif
