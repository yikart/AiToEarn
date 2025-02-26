/*
 * Copyright (C) 1999-2000 Harri Porten (porten@kde.org)
 * Copyright (C) 2006-2023 Apple Inc. All rights reserved.
 * Copyright (C) 2009 Google Inc. All rights reserved.
 * Copyright (C) 2012 the V8 project authors. All rights reserved.
 * Copyright (C) 2010 Research In Motion Limited. All rights reserved.
 *
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla Communicator client code, released
 * March 31, 1998.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 1998
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either of the GNU General Public License Version 2 or later (the "GPL"),
 * or the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 */

#pragma once

#include "DateInstanceCache.h"
#include <wtf/DateMath.h>
#include <wtf/GregorianDateTime.h>
#include <wtf/SaturatedArithmetic.h>
#include <wtf/TZoneMalloc.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

class JSGlobalObject;
class OpaqueICUTimeZone;
class VM;

static constexpr double minECMAScriptTime = -8.64E15;

#if PLATFORM(COCOA)
extern JS_EXPORT_PRIVATE std::atomic<uint64_t> lastTimeZoneID;
#endif

// We do not expose icu::TimeZone in this header file. And we cannot use icu::TimeZone forward declaration
// because icu namespace can be an alias to icu$verNum namespace.
struct OpaqueICUTimeZoneDeleter {
    JS_EXPORT_PRIVATE void operator()(OpaqueICUTimeZone*);
};

struct LocalTimeOffsetCache {
    LocalTimeOffsetCache() = default;

    bool isEmpty() { return start > end; }

    LocalTimeOffset offset { };
    int64_t start { WTF::Int64Milliseconds::maxECMAScriptTime };
    int64_t end { WTF::Int64Milliseconds::minECMAScriptTime };
    uint64_t epoch { 0 };
};

class DateCache {
    WTF_MAKE_TZONE_ALLOCATED(DateCache);
    WTF_MAKE_NONCOPYABLE(DateCache);
public:
    DateCache();
    ~DateCache();

    bool hasTimeZoneChange()
    {
#if PLATFORM(COCOA)
        return m_cachedTimezoneID != lastTimeZoneID;
#else
        return true; // always force a time zone check.
#endif
    }

    void resetIfNecessary()
    {
#if PLATFORM(COCOA)
        if (LIKELY(!hasTimeZoneChange()))
            return;
        m_cachedTimezoneID = lastTimeZoneID;
#endif
        resetIfNecessarySlow();
    }

    JS_EXPORT_PRIVATE void resetIfNecessarySlow();

    String defaultTimeZone();
    String timeZoneDisplayName(bool isDST);
    Ref<DateInstanceData> cachedDateInstanceData(double millisecondsFromEpoch);

    void msToGregorianDateTime(double millisecondsFromEpoch, WTF::TimeType outputTimeType, GregorianDateTime&);
    double gregorianDateTimeToMS(const GregorianDateTime&, double milliseconds, WTF::TimeType);
    double localTimeToMS(double milliseconds, WTF::TimeType);
    JS_EXPORT_PRIVATE double parseDate(JSGlobalObject*, VM&, const WTF::String&);

    static void timeZoneChanged();

private:
    class DSTCache {
    public:
        static constexpr unsigned cacheSize = 32;
        // The implementation relies on the fact that no time zones have
        // more than one daylight savings offset change per 19 days.
        // In Egypt in 2010 they decided to suspend DST during Ramadan. This
        // led to a short interval where DST is in effect from September 10 to
        // September 30.
        static constexpr int64_t defaultDSTDeltaInMilliseconds = 19 * WTF::Int64Milliseconds::secondsPerDay * 1000;

        DSTCache()
            : m_before(m_entries.data())
            , m_after(m_entries.data() + 1)
        {
        }

        uint64_t bumpEpoch()
        {
            ++m_epoch;
            return m_epoch;
        }

        void reset()
        {
            m_entries.fill(LocalTimeOffsetCache { });
            m_before = m_entries.data();
            m_after = m_entries.data() + 1;
            m_epoch = 0;
        }

        LocalTimeOffset localTimeOffset(DateCache&, int64_t millisecondsFromEpoch, WTF::TimeType);

    private:
        LocalTimeOffsetCache* leastRecentlyUsed(LocalTimeOffsetCache* exclude);
        std::tuple<LocalTimeOffsetCache*, LocalTimeOffsetCache*> probe(int64_t millisecondsFromEpoch);
        void extendTheAfterCache(int64_t millisecondsFromEpoch, LocalTimeOffset);

        uint64_t m_epoch { 0 };
        std::array<LocalTimeOffsetCache, cacheSize> m_entries { };
        LocalTimeOffsetCache* m_before;
        LocalTimeOffsetCache* m_after;
    };

    struct YearMonthDayCache {
        int32_t m_days { 0 };
        int32_t m_year { 0 };
        int32_t m_month { 0 };
        int32_t m_day { 0 };
    };

    void timeZoneCacheSlow();
    LocalTimeOffset localTimeOffset(int64_t millisecondsFromEpoch, WTF::TimeType inputTimeType = WTF::UTCTime)
    {
        static_assert(!WTF::UTCTime);
        static_assert(WTF::LocalTime == 1);
        return m_caches[static_cast<unsigned>(inputTimeType)].localTimeOffset(*this, millisecondsFromEpoch, inputTimeType);
    }

    LocalTimeOffset calculateLocalTimeOffset(double millisecondsFromEpoch, WTF::TimeType inputTimeType);

    OpaqueICUTimeZone* timeZoneCache()
    {
        if (!m_timeZoneCache)
            timeZoneCacheSlow();
        return m_timeZoneCache.get();
    }

    std::tuple<int32_t, int32_t, int32_t> yearMonthDayFromDaysWithCache(int32_t days);

    std::unique_ptr<OpaqueICUTimeZone, OpaqueICUTimeZoneDeleter> m_timeZoneCache;
    std::array<DSTCache, 2> m_caches;
    std::optional<YearMonthDayCache> m_yearMonthDayCache;
    String m_cachedDateString;
    double m_cachedDateStringValue;
    DateInstanceCache m_dateInstanceCache;
    uint64_t m_cachedTimezoneID { 0 };
    String m_timeZoneStandardDisplayNameCache;
    String m_timeZoneDSTDisplayNameCache;
};

ALWAYS_INLINE bool isUTCEquivalent(StringView timeZone)
{
    return timeZone == "Etc/UTC"_s || timeZone == "Etc/GMT"_s || timeZone == "GMT"_s;
}

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
