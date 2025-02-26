/*
 * Copyright (C) 2013 Google Inc. All rights reserved.
 * Copyright (C) 2014 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#if ENABLE(VIDEO)

#include "ContextDestructionObserver.h"
#include "FloatPoint.h"
#include "TextTrack.h"
#include "Timer.h"

namespace WebCore {

class HTMLDivElement;
class VTTCueBox;
class VTTScanner;

class WEBCORE_EXPORT VTTRegion final : public RefCounted<VTTRegion>, public ContextDestructionObserver {
public:
    static Ref<VTTRegion> create(ScriptExecutionContext& context)
    {
        return adoptRef(*new VTTRegion(context));
    }

    virtual ~VTTRegion();

    const String& id() const { return m_id; }
    void setId(const String&);

    double width() const { return m_width; }
    ExceptionOr<void> setWidth(double);

    unsigned lines() const { return m_lines; }
    void setLines(unsigned);

    double regionAnchorX() const { return m_regionAnchor.x(); }
    ExceptionOr<void> setRegionAnchorX(double);

    double regionAnchorY() const { return m_regionAnchor.y(); }
    ExceptionOr<void> setRegionAnchorY(double);

    double viewportAnchorX() const { return m_viewportAnchor.x(); }
    ExceptionOr<void> setViewportAnchorX(double);

    double viewportAnchorY() const { return m_viewportAnchor.y(); }
    ExceptionOr<void> setViewportAnchorY(double);

    enum class ScrollSetting : bool { EmptyString, Up };
    ScrollSetting scroll() const { return m_scroll; }
    void setScroll(const ScrollSetting);

    void updateParametersFromRegion(const VTTRegion&);

    const String& regionSettings() const { return m_settings; }
    void setRegionSettings(const String&);

    HTMLDivElement& getDisplayTree();
    
    void appendTextTrackCueBox(Ref<TextTrackCueBox>&&);
    void displayLastTextTrackCueBox();
    void willRemoveTextTrackCueBox(VTTCueBox*);

    void cueStyleChanged() { m_recalculateStyles = true; }

private:
    VTTRegion(ScriptExecutionContext&);

    void prepareRegionDisplayTree();

    // The timer is needed to continue processing when cue scrolling ended.
    void startTimer();
    void stopTimer();
    void scrollTimerFired();

    enum RegionSetting {
        None,
        Id,
        Width,
        Lines,
        RegionAnchor,
        ViewportAnchor,
        Scroll
    };

    RegionSetting scanSettingName(VTTScanner&);

    void parseSettingValue(RegionSetting, VTTScanner&);

    static const AtomString& textTrackCueContainerScrollingClass();

    String m_id;
    String m_settings;

    double m_width { 100 };
    unsigned m_lines { 3 };

    FloatPoint m_regionAnchor { 0, 100 };
    FloatPoint m_viewportAnchor { 0, 100 };

    ScrollSetting m_scroll { ScrollSetting::EmptyString };

    // The cue container is the container that is scrolled up to obtain the
    // effect of scrolling cues when this is enabled for the regions.
    RefPtr<HTMLDivElement> m_cueContainer;
    RefPtr<HTMLDivElement> m_regionDisplayTree;

    // Keep track of the current numeric value of the css "top" property.
    double m_currentTop { 0 };

    // The timer is used to display the next cue line after the current one has
    // been displayed. It's main use is for scrolling regions and it triggers as
    // soon as the animation for rolling out one line has finished, but
    // currently it is used also for non-scrolling regions to use a single
    // code path.
    Timer m_scrollTimer;

    bool m_recalculateStyles { true };
};

} // namespace WebCore

#endif
