/*
 * Copyright (C) 2014 Apple Inc. All rights reserved.
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

#include <algorithm>
#include <wtf/ArgumentCoder.h>
#include <wtf/MediaTime.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>

OBJC_CLASS NSArray;

namespace WTF {
class PrintStream;
}

namespace WebCore {

enum class AddTimeRangeOption : uint8_t {
    None,
    EliminateSmallGaps,
};

class WEBCORE_EXPORT PlatformTimeRanges final {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(PlatformTimeRanges, WEBCORE_EXPORT);
public:
    PlatformTimeRanges();
    PlatformTimeRanges(const MediaTime& start, const MediaTime& end);

    PlatformTimeRanges copyWithEpsilon(const MediaTime&) const;

    static const PlatformTimeRanges& emptyRanges();
    static MediaTime timeFudgeFactor();

    MediaTime start(unsigned index) const;
    MediaTime start(unsigned index, bool& valid) const;
    MediaTime end(unsigned index) const;
    MediaTime end(unsigned index, bool& valid) const;
    MediaTime duration(unsigned index) const;
    MediaTime maximumBufferedTime() const;
    MediaTime minimumBufferedTime() const;

    void invert();
    void intersectWith(const PlatformTimeRanges&);
    void unionWith(const PlatformTimeRanges&);
    PlatformTimeRanges& operator+=(const PlatformTimeRanges&);
    PlatformTimeRanges& operator-=(const PlatformTimeRanges&);

    unsigned length() const { return m_ranges.size(); }

    void add(const MediaTime& start, const MediaTime& end, AddTimeRangeOption = AddTimeRangeOption::None);
    void clear();
    
    bool contain(const MediaTime&) const;

    size_t find(const MediaTime&) const;
    size_t findWithEpsilon(const MediaTime&, const MediaTime& epsilon);
    
    MediaTime nearest(const MediaTime&) const;

    MediaTime totalDuration() const;

    void dump(PrintStream&) const;
    String toString() const;

    // We consider all the Ranges to be semi-bounded as follow: [start, end[
    struct Range {
        MediaTime start;
        MediaTime end;

        inline bool isEmpty() const
        {
            return start == end;
        }

        inline bool isPointInRange(const MediaTime& point) const
        {
            return start <= point && point < end;
        }
        
        inline bool isOverlappingRange(const Range& range) const
        {
            return isPointInRange(range.start) || isPointInRange(range.end) || range.isPointInRange(start);
        }

        inline bool isContiguousWithRange(const Range& range) const
        {
            return range.start == end || range.end == start;
        }
        
        inline Range unionWithOverlappingOrContiguousRange(const Range& range) const
        {
            Range ret;

            ret.start = std::min(start, range.start);
            ret.end = std::max(end, range.end);

            return ret;
        }

        inline bool isBeforeRange(const Range& range) const
        {
            return range.start >= end;
        }

        friend bool operator==(const Range&, const Range&) = default;
    };

    friend bool operator==(const PlatformTimeRanges&, const PlatformTimeRanges&) = default;

private:
    friend struct IPC::ArgumentCoder<PlatformTimeRanges, void>;

    PlatformTimeRanges(Vector<Range>&&);
    PlatformTimeRanges& operator-=(const Range&);

    size_t findLastRangeIndexBefore(const MediaTime& start, const MediaTime& end) const;

    Vector<Range> m_ranges;
};

#if PLATFORM(COCOA)
RetainPtr<NSArray> makeNSArray(const PlatformTimeRanges&);
#endif

} // namespace WebCore

namespace WTF {
template<typename> struct LogArgument;

template<> struct LogArgument<WebCore::PlatformTimeRanges> {
    static String toString(const WebCore::PlatformTimeRanges& platformTimeRanges) { return platformTimeRanges.toString(); }
};

} // namespace WTF
