/*
 * Copyright (C) 2011, 2012 Apple Inc. All rights reserved.
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

#include "CSSColorValue.h"
#include "CSSPrimitiveValue.h"
#include "ColorHash.h"
#include <wtf/HashMap.h>
#include <wtf/NeverDestroyed.h>
#include <wtf/text/AtomStringHash.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace WebCore {

class CSSValueList;
class CSSValuePool;

class StaticCSSValuePool {
    friend class CSSPrimitiveValue;
    friend class CSSValuePool;
    friend class LazyNeverDestroyed<StaticCSSValuePool>;

public:
    static void init();

private:
    StaticCSSValuePool();

    LazyNeverDestroyed<CSSPrimitiveValue> m_implicitInitialValue;

    LazyNeverDestroyed<CSSColorValue> m_transparentColor;
    LazyNeverDestroyed<CSSColorValue> m_whiteColor;
    LazyNeverDestroyed<CSSColorValue> m_blackColor;

    static constexpr int maximumCacheableIntegerValue = 255;

    LazyNeverDestroyed<CSSPrimitiveValue> m_pixelValues[maximumCacheableIntegerValue + 1];
    LazyNeverDestroyed<CSSPrimitiveValue> m_percentageValues[maximumCacheableIntegerValue + 1];
    LazyNeverDestroyed<CSSPrimitiveValue> m_numberValues[maximumCacheableIntegerValue + 1];
    LazyNeverDestroyed<CSSPrimitiveValue> m_identifierValues[numCSSValueKeywords];
};

WEBCORE_EXPORT extern LazyNeverDestroyed<StaticCSSValuePool> staticCSSValuePool;

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(CSSValuePool);
class CSSValuePool {
    WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(CSSValuePool);
    WTF_MAKE_NONCOPYABLE(CSSValuePool);
public:
    CSSValuePool();
    static CSSValuePool& singleton();
    void drain();

    Ref<CSSColorValue> createColorValue(const WebCore::Color&);
    RefPtr<CSSValueList> createFontFaceValue(const AtomString&);
    Ref<CSSPrimitiveValue> createFontFamilyValue(const AtomString&);

private:
    UncheckedKeyHashMap<WebCore::Color, Ref<CSSColorValue>> m_colorValueCache;
    UncheckedKeyHashMap<AtomString, RefPtr<CSSValueList>> m_fontFaceValueCache;
    UncheckedKeyHashMap<AtomString, Ref<CSSPrimitiveValue>> m_fontFamilyValueCache;
};

inline CSSPrimitiveValue& CSSPrimitiveValue::implicitInitialValue()
{
    return staticCSSValuePool->m_implicitInitialValue.get();
}

inline Ref<CSSPrimitiveValue> CSSPrimitiveValue::create(CSSValueID identifier)
{
    RELEASE_ASSERT(identifier < numCSSValueKeywords);
    return staticCSSValuePool->m_identifierValues[identifier].get();
}

} // namespace WebCore

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
