/*
 * Copyright (C) 2023 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "ControlFactory.h"
#include "ControlPart.h"

namespace WebCore {

class SwitchTrackPart final : public ControlPart {
public:
    static Ref<SwitchTrackPart> create()
    {
        return adoptRef(*new SwitchTrackPart(false, 0.0f));
    }

    static Ref<SwitchTrackPart> create(bool isOn, float progress)
    {
        return adoptRef(*new SwitchTrackPart(isOn, progress));
    }

    SwitchTrackPart(bool isOn, float progress)
        : ControlPart(StyleAppearance::SwitchTrack)
        , m_isOn(isOn)
        , m_progress(progress)
    {
    }

    bool isOn() const { return m_isOn; }
    void setIsOn(bool isOn) { m_isOn = isOn; }

    float progress() const { return m_progress; }
    void setProgress(float progress) { m_progress = progress; }

private:
    SwitchTrackPart()
        : ControlPart(StyleAppearance::SwitchTrack)
    {
    }

    std::unique_ptr<PlatformControl> createPlatformControl() final
    {
        return controlFactory().createPlatformSwitchTrack(*this);
    }

    bool m_isOn;
    float m_progress;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_CONTROL_PART(SwitchTrack)
