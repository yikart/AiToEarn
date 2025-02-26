/*
 * Copyright (C) 2000 Lars Knoll (knoll@kde.org)
 *           (C) 2000 Antti Koivisto (koivisto@kde.org)
 *           (C) 2000 Dirk Mueller (mueller@kde.org)
 * Copyright (C) 2003-2017 Apple Inc. All rights reserved.
 * Copyright (C) 2006 Graham Dennis (graham.dennis@gmail.com)
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public License
 * along with this library; see the file COPYING.LIB.  If not, write to
 * the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA 02110-1301, USA.
 *
 */

#pragma once

#include "CSSPropertyNames.h"
#include "CompositeOperation.h"
#include "RenderStyleConstants.h"
#include "ScopedName.h"
#include "ScrollTimeline.h"
#include "TimingFunction.h"
#include "ViewTimeline.h"
#include "WebAnimationTypes.h"

namespace WebCore {

class Animation : public RefCounted<Animation> {
public:
    WEBCORE_EXPORT ~Animation();

    static Ref<Animation> create() { return adoptRef(*new Animation); }
    static Ref<Animation> create(const Animation& other) { return adoptRef(*new Animation(other)); }

    bool isDelaySet() const { return m_delaySet; }
    bool isDirectionSet() const { return m_directionSet; }
    bool isDurationSet() const { return m_durationSet; }
    bool isFillModeSet() const { return m_fillModeSet; }
    bool isIterationCountSet() const { return m_iterationCountSet; }
    bool isNameSet() const { return m_nameSet; }
    bool isPlayStateSet() const { return m_playStateSet; }
    bool isPropertySet() const { return m_propertySet; }
    bool isTimelineSet() const { return m_timelineSet; }
    bool isTimingFunctionSet() const { return m_timingFunctionSet; }
    bool isCompositeOperationSet() const { return m_compositeOperationSet; }
    bool isAllowsDiscreteTransitionsSet() const { return m_allowsDiscreteTransitionsSet; }
    bool isRangeStartSet() const { return m_rangeStartSet; }
    bool isRangeEndSet() const { return m_rangeEndSet; }

    // Flags this to be the special "none" animation (animation-name: none)
    bool isNoneAnimation() const { return m_isNone; }

    // We can make placeholder Animation objects to keep the comma-separated lists
    // of properties in sync. isValidAnimation means this is not a placeholder.
    bool isValidAnimation() const { return !m_isNone && !m_name.name.isEmpty(); }

    bool isEmpty() const
    {
        return !m_directionSet && !m_durationSet && !m_fillModeSet
            && !m_nameSet && !m_playStateSet && !m_iterationCountSet
            && !m_delaySet && !m_timingFunctionSet && !m_propertySet
            && !m_isNone && !m_compositeOperationSet && !m_timelineSet
            && !m_allowsDiscreteTransitionsSet && !m_rangeStartSet
            && !m_rangeEndSet;
    }

    bool isEmptyOrZeroDuration() const
    {
        return isEmpty() || ((!m_duration || !*m_duration) && m_delay <= 0);
    }

    void clearDelay() { m_delaySet = false; m_delayFilled = false; }
    void clearDirection() { m_directionSet = false; m_directionFilled = false; }
    void clearDuration() { m_durationSet = false; m_durationFilled = false; }
    void clearFillMode() { m_fillModeSet = false; m_fillModeFilled = false; }
    void clearIterationCount() { m_iterationCountSet = false; m_iterationCountFilled = false; }
    void clearName() { m_nameSet = false; }
    void clearPlayState() { m_playStateSet = false; m_playStateFilled = false; }
    void clearProperty() { m_propertySet = false; m_propertyFilled = false; }
    void clearTimeline() { m_timelineSet = false; m_timelineFilled = false; }
    void clearTimingFunction() { m_timingFunctionSet = false; m_timingFunctionFilled = false; }
    void clearCompositeOperation() { m_compositeOperationSet = false; m_compositeOperationFilled = false; }
    void clearAllowsDiscreteTransitions() { m_allowsDiscreteTransitionsSet = false; m_allowsDiscreteTransitionsFilled = false; }
    void clearRangeStart() { m_rangeStartSet = false; m_rangeStartFilled = false; }
    void clearRangeEnd() { m_rangeEndSet = false; m_rangeEndFilled = false; }

    void clearAll()
    {
        clearDelay();
        clearDirection();
        clearDuration();
        clearFillMode();
        clearIterationCount();
        clearName();
        clearPlayState();
        clearProperty();
        clearTimeline();
        clearTimingFunction();
        clearCompositeOperation();
        clearAllowsDiscreteTransitions();
        clearRangeStart();
        clearRangeEnd();
    }

    double delay() const { return m_delay; }

    enum class TransitionMode : uint8_t {
        All,
        None,
        SingleProperty,
        UnknownProperty
    };

    struct TransitionProperty {
        TransitionMode mode;
        AnimatableCSSProperty animatableProperty;
        bool operator==(const TransitionProperty& o) const { return mode == o.mode && animatableProperty == o.animatableProperty; }
    };

    enum class Direction : uint8_t {
        Normal,
        Alternate,
        Reverse,
        AlternateReverse
    };

    enum class TimelineKeyword : bool { None, Auto };
    struct AnonymousScrollTimeline {
        Scroller scroller;
        ScrollAxis axis;
        bool operator==(const AnonymousScrollTimeline& o) const { return scroller == o.scroller && axis == o.axis; }
    };
    struct AnonymousViewTimeline {
        ScrollAxis axis;
        ViewTimelineInsets insets;
        bool operator==(const AnonymousViewTimeline& o) const { return axis == o.axis && insets == o.insets; }
    };
    using Timeline = std::variant<TimelineKeyword, AtomString, AnonymousScrollTimeline, AnonymousViewTimeline>;

    Direction direction() const { return static_cast<Direction>(m_direction); }
    bool directionIsForwards() const { return direction() == Direction::Normal || direction() == Direction::Alternate; }

    AnimationFillMode fillMode() const { return static_cast<AnimationFillMode>(m_fillMode); }

    MarkableDouble duration() const { return m_duration; }
    double playbackRate() const { return m_playbackRate; }

    static constexpr double IterationCountInfinite = -1;
    double iterationCount() const { return m_iterationCount; }
    const Style::ScopedName& name() const { return m_name; }
    AnimationPlayState playState() const { return static_cast<AnimationPlayState>(m_playState); }
    TransitionProperty property() const { return m_property; }
    const Timeline& timeline() const { return m_timeline; }
    TimingFunction* timingFunction() const { return m_timingFunction.get(); }
    TimingFunction* defaultTimingFunctionForKeyframes() const { return m_defaultTimingFunctionForKeyframes.get(); }
    const SingleTimelineRange rangeStart() const { return m_range.start; }
    const SingleTimelineRange rangeEnd() const { return m_range.end; }
    const TimelineRange range() const { return m_range; }

    void setDelay(double c) { m_delay = c; m_delaySet = true; }
    void setDirection(Direction d) { m_direction = static_cast<unsigned>(d); m_directionSet = true; }
    void setDuration(MarkableDouble d) { ASSERT(!d || *d >= 0); m_duration = d; m_durationSet = true; }
    void setPlaybackRate(double d) { m_playbackRate = d; }
    void setFillMode(AnimationFillMode f) { m_fillMode = static_cast<unsigned>(f); m_fillModeSet = true; }
    void setIterationCount(double c) { m_iterationCount = c; m_iterationCountSet = true; }
    void setName(const Style::ScopedName& name)
    {
        m_name = name;
        m_nameSet = true;
    }
    void setPlayState(AnimationPlayState d) { m_playState = static_cast<unsigned>(d); m_playStateSet = true; }
    void setProperty(TransitionProperty t) { m_property = t; m_propertySet = true; }
    void setTimeline(Timeline timeline) { m_timeline = timeline; m_timelineSet = true; }
    void setTimingFunction(RefPtr<TimingFunction>&& function) { m_timingFunction = WTFMove(function); m_timingFunctionSet = true; }
    void setDefaultTimingFunctionForKeyframes(RefPtr<TimingFunction>&& function) { m_defaultTimingFunctionForKeyframes = WTFMove(function); }
    void setRangeStart(SingleTimelineRange range) { m_range.start = range; m_rangeStartSet = true; }
    void setRangeEnd(SingleTimelineRange range) { m_range.end = range; m_rangeEndSet = true; }
    void setRange(TimelineRange range) { setRangeStart(range.start); setRangeEnd(range.end); }

    void setIsNoneAnimation(bool n) { m_isNone = n; }

    void fillDelay(double delay) { setDelay(delay); m_delayFilled = true; }
    void fillDirection(Direction direction) { setDirection(direction); m_directionFilled = true; }
    void fillDuration(MarkableDouble duration) { setDuration(duration); m_durationFilled = true; }
    void fillFillMode(AnimationFillMode fillMode) { setFillMode(fillMode); m_fillModeFilled = true; }
    void fillIterationCount(double iterationCount) { setIterationCount(iterationCount); m_iterationCountFilled = true; }
    void fillPlayState(AnimationPlayState playState) { setPlayState(playState); m_playStateFilled = true; }
    void fillProperty(TransitionProperty property) { setProperty(property); m_propertyFilled = true; }
    void fillTimeline(Timeline timeline) { setTimeline(timeline); m_timelineFilled = true; }
    void fillTimingFunction(RefPtr<TimingFunction>&& timingFunction) { setTimingFunction(WTFMove(timingFunction)); m_timingFunctionFilled = true; }
    void fillCompositeOperation(CompositeOperation compositeOperation) { setCompositeOperation(compositeOperation); m_compositeOperationFilled = true; }
    void fillAllowsDiscreteTransitions(bool allowsDiscreteTransitionsFilled) { setAllowsDiscreteTransitions(allowsDiscreteTransitionsFilled); m_allowsDiscreteTransitionsFilled = true; }
    void fillRangeStart(SingleTimelineRange range) { m_range.start = range; m_rangeStartFilled = true; }
    void fillRangeEnd(SingleTimelineRange range) { m_range.end = range; m_rangeEndFilled = true; }

    bool isDelayFilled() const { return m_delayFilled; }
    bool isDirectionFilled() const { return m_directionFilled; }
    bool isDurationFilled() const { return m_durationFilled; }
    bool isFillModeFilled() const { return m_fillModeFilled; }
    bool isIterationCountFilled() const { return m_iterationCountFilled; }
    bool isPlayStateFilled() const { return m_playStateFilled; }
    bool isPropertyFilled() const { return m_propertyFilled; }
    bool isTimelineFilled() const { return m_timelineFilled; }
    bool isTimingFunctionFilled() const { return m_timingFunctionFilled; }
    bool isCompositeOperationFilled() const { return m_compositeOperationFilled; }
    bool isAllowsDiscreteTransitionsFilled() const { return m_allowsDiscreteTransitionsFilled; }
    bool isRangeStartFilled() const { return m_rangeStartFilled; }
    bool isRangeEndFilled() const { return m_rangeEndFilled; }
    bool isRangeFilled() const { return isRangeStartFilled() || isRangeEndFilled(); }

    // return true if all members of this class match (excluding m_next)
    bool animationsMatch(const Animation&, bool matchProperties = true) const;

    // return true every Animation in the chain (defined by m_next) match
    bool operator==(const Animation& o) const { return animationsMatch(o); }

    bool fillsBackwards() const { return m_fillModeSet && (fillMode() == AnimationFillMode::Backwards || fillMode() == AnimationFillMode::Both); }
    bool fillsForwards() const { return m_fillModeSet && (fillMode() == AnimationFillMode::Forwards || fillMode() == AnimationFillMode::Both); }

    CompositeOperation compositeOperation() const { return static_cast<CompositeOperation>(m_compositeOperation); }
    void setCompositeOperation(CompositeOperation op) { m_compositeOperation = static_cast<unsigned>(op); m_compositeOperationSet = true; }

    void setAllowsDiscreteTransitions(bool allowsDiscreteTransitions) { m_allowsDiscreteTransitions = allowsDiscreteTransitions; m_allowsDiscreteTransitionsSet = true; }
    bool allowsDiscreteTransitions() const { return m_allowsDiscreteTransitions; }

private:
    WEBCORE_EXPORT Animation();
    Animation(const Animation&);

    // Packs with m_refCount from the base class.
    TransitionProperty m_property { TransitionMode::All, CSSPropertyInvalid };

    Style::ScopedName m_name;
    double m_iterationCount;
    double m_delay;
    MarkableDouble m_duration;
    double m_playbackRate { 1 };
    Timeline m_timeline;
    RefPtr<TimingFunction> m_timingFunction;
    RefPtr<TimingFunction> m_defaultTimingFunctionForKeyframes;
    TimelineRange m_range;

    unsigned m_direction : 2; // Direction
    unsigned m_fillMode : 2; // AnimationFillMode
    unsigned m_playState : 2; // AnimationPlayState
    unsigned m_compositeOperation : 2; // CompositeOperation
    bool m_allowsDiscreteTransitions : 1;

    bool m_delaySet : 1;
    bool m_directionSet : 1;
    bool m_durationSet : 1;
    bool m_fillModeSet : 1;
    bool m_iterationCountSet : 1;
    bool m_nameSet : 1;
    bool m_playStateSet : 1;
    bool m_propertySet : 1;
    bool m_timelineSet : 1;
    bool m_timingFunctionSet : 1;
    bool m_compositeOperationSet : 1;
    bool m_allowsDiscreteTransitionsSet : 1;
    bool m_rangeStartSet : 1;
    bool m_rangeEndSet : 1;

    bool m_isNone : 1;

    bool m_delayFilled : 1;
    bool m_directionFilled : 1;
    bool m_durationFilled : 1;
    bool m_fillModeFilled : 1;
    bool m_iterationCountFilled : 1;
    bool m_playStateFilled : 1;
    bool m_propertyFilled : 1;
    bool m_timelineFilled : 1;
    bool m_timingFunctionFilled : 1;
    bool m_compositeOperationFilled : 1;
    bool m_allowsDiscreteTransitionsFilled : 1;
    bool m_rangeStartFilled : 1;
    bool m_rangeEndFilled : 1;

public:
    static double initialDelay() { return 0; }
    static Direction initialDirection() { return Direction::Normal; }
    static MarkableDouble initialDuration() { return std::nullopt; }
    static AnimationFillMode initialFillMode() { return AnimationFillMode::None; }
    static double initialIterationCount() { return 1.0; }
    static const Style::ScopedName& initialName();
    static AnimationPlayState initialPlayState() { return AnimationPlayState::Playing; }
    static CompositeOperation initialCompositeOperation() { return CompositeOperation::Replace; }
    static TransitionProperty initialProperty() { return { TransitionMode::All, CSSPropertyInvalid }; }
    static Timeline initialTimeline() { return TimelineKeyword::Auto; }
    static Ref<TimingFunction> initialTimingFunction() { return CubicBezierTimingFunction::create(); }
    static bool initialAllowsDiscreteTransitions() { return false; }
    static TimelineRange initialRange() { return { }; }
    static SingleTimelineRange initialRangeStart() { return { }; }
    static SingleTimelineRange initialRangeEnd() { return { }; }
};

WTF::TextStream& operator<<(WTF::TextStream&, AnimationPlayState);
WTF::TextStream& operator<<(WTF::TextStream&, Animation::TransitionProperty);
WTF::TextStream& operator<<(WTF::TextStream&, Animation::Direction);
WTF::TextStream& operator<<(WTF::TextStream&, Animation::TimelineKeyword);
WTF::TextStream& operator<<(WTF::TextStream&, const Animation::AnonymousScrollTimeline&);
WTF::TextStream& operator<<(WTF::TextStream&, const Animation::AnonymousViewTimeline&);
WTF::TextStream& operator<<(WTF::TextStream&, const Animation::Timeline&);
WTF::TextStream& operator<<(WTF::TextStream&, const Animation&);

} // namespace WebCore
