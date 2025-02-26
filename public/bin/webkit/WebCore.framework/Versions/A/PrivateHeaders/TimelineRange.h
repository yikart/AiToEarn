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

#include "Length.h"
#include "WebAnimationTypes.h"

namespace WebCore {

namespace Style {
class BuilderState;
}

class Element;

struct SingleTimelineRange {
    enum class Name { Normal, Omitted, Cover, Contain, Entry, Exit, EntryCrossing, ExitCrossing };

    Name name { Name::Normal };
    Length offset;

    bool operator==(const SingleTimelineRange& other) const = default;

    enum class Type : bool { Start, End };
    static bool isDefault(const Length&, Type);
    static bool isDefault(const CSSPrimitiveValue&, Type);
    static Length defaultValue(Type);
    static Length lengthForCSSValue(RefPtr<const CSSPrimitiveValue>, RefPtr<Element>);

    static bool isOffsetValue(const CSSPrimitiveValue&);

    static Name timelineName(CSSValueID);
    static CSSValueID valueID(Name);

    static SingleTimelineRange range(const CSSValue&, Type, const Style::BuilderState* = nullptr, RefPtr<Element> = nullptr);
    static SingleTimelineRange parse(TimelineRangeValue&&, RefPtr<Element>, Type);
    TimelineRangeValue serialize() const;
};

struct TimelineRange {
    SingleTimelineRange start;
    SingleTimelineRange end;

    bool operator==(const TimelineRange& other) const = default;

    static TimelineRange defaultForScrollTimeline();
    static TimelineRange defaultForViewTimeline();
    bool isDefault() const { return start.name == SingleTimelineRange::Name::Normal && end.name == SingleTimelineRange::Name::Normal; }
};

WTF::TextStream& operator<<(WTF::TextStream&, const SingleTimelineRange&);

} // namespace WebCore
