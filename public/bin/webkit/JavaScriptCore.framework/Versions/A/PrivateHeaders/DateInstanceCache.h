/*
 * Copyright (C) 2009 Apple Inc. All Rights Reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
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

#include "PureNaN.h"
#include <array>
#include <wtf/GregorianDateTime.h>
#include <wtf/HashFunctions.h>
#include <wtf/RefCounted.h>

namespace JSC {

class DateInstanceData : public RefCounted<DateInstanceData> {
public:
    static Ref<DateInstanceData> create() { return adoptRef(*new DateInstanceData); }

    static constexpr ptrdiff_t offsetOfGregorianDateTimeCachedForMS() { return OBJECT_OFFSETOF(DateInstanceData, m_gregorianDateTimeCachedForMS); }
    static constexpr ptrdiff_t offsetOfCachedGregorianDateTime() { return OBJECT_OFFSETOF(DateInstanceData, m_cachedGregorianDateTime); }
    static constexpr ptrdiff_t offsetOfGregorianDateTimeUTCCachedForMS() { return OBJECT_OFFSETOF(DateInstanceData, m_gregorianDateTimeUTCCachedForMS); }
    static constexpr ptrdiff_t offsetOfCachedGregorianDateTimeUTC() { return OBJECT_OFFSETOF(DateInstanceData, m_cachedGregorianDateTimeUTC); }

    double m_gregorianDateTimeCachedForMS { PNaN };
    GregorianDateTime m_cachedGregorianDateTime;
    double m_gregorianDateTimeUTCCachedForMS { PNaN };
    GregorianDateTime m_cachedGregorianDateTimeUTC;

private:
    DateInstanceData() = default;
};

class DateInstanceCache {
public:
    DateInstanceCache()
    {
        reset();
    }

    void reset()
    {
        for (size_t i = 0; i < cacheSize; ++i)
            m_cache[i].key = PNaN;
    }

    DateInstanceData* add(double d)
    {
        CacheEntry& entry = lookup(d);
        if (d == entry.key)
            return entry.value.get();

        entry.key = d;
        entry.value = DateInstanceData::create();
        return entry.value.get();
    }

private:
    static const size_t cacheSize = 16;

    struct CacheEntry {
        double key;
        RefPtr<DateInstanceData> value;
    };

    CacheEntry& lookup(double d) { return m_cache[WTF::FloatHash<double>::hash(d) & (cacheSize - 1)]; }

    std::array<CacheEntry, cacheSize> m_cache;
};

} // namespace JSC
