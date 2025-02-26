/*
 * Copyright (C) 2023 Apple Inc. All rights reserved.
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

#include "CSSNumericValue.h"
#include "Length.h"
#include "ScrollTimeline.h"
#include "ViewTimelineOptions.h"
#include <wtf/Ref.h>
#include <wtf/WeakPtr.h>

namespace WebCore {

namespace Style {
class BuilderState;
}

class Element;

struct TimelineRange;

struct ViewTimelineInsets {
    std::optional<Length> start;
    std::optional<Length> end;
    bool operator==(const ViewTimelineInsets&) const = default;
};

class ViewTimeline final : public ScrollTimeline {
public:
    static Ref<ViewTimeline> create(ViewTimelineOptions&& = { });
    static Ref<ViewTimeline> create(const AtomString&, ScrollAxis, ViewTimelineInsets&&);

    Element* subject() const { return m_subject.get(); }
    void setSubject(const Element*);

    const ViewTimelineInsets& insets() const { return m_insets; }
    void setInsets(ViewTimelineInsets&& insets) { m_insets = WTFMove(insets); }

    Ref<CSSNumericValue> startOffset();
    Ref<CSSNumericValue> endOffset();

    AnimationTimeline::ShouldUpdateAnimationsAndSendEvents documentWillUpdateAnimationsAndSendEvents() override;
    AnimationTimelinesController* controller() const override;

    RenderBox* sourceScrollerRenderer() const;
    Element* source() const override;
    TimelineRange defaultRange() const final;

private:
    ScrollTimeline::Data computeTimelineData() const final;
    std::pair<WebAnimationTime, WebAnimationTime> intervalForAttachmentRange(const TimelineRange&) const final;

    explicit ViewTimeline(ViewTimelineOptions&& = { });
    explicit ViewTimeline(const AtomString&, ScrollAxis, ViewTimelineInsets&&);

    bool isViewTimeline() const final { return true; }

    struct CurrentTimeData {
        float scrollOffset { 0 };
        float scrollContainerSize { 0 };
        float subjectOffset { 0 };
        float subjectSize { 0 };
        float insetStart { 0 };
        float insetEnd { 0 };
    };

    void cacheCurrentTime();

    WeakPtr<Element, WeakPtrImplWithEventTargetData> m_subject;
    ViewTimelineInsets m_insets;
    CurrentTimeData m_cachedCurrentTimeData { };
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_ANIMATION_TIMELINE(ViewTimeline, isViewTimeline())
