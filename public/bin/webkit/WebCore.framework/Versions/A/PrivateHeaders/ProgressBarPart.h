/*
 * Copyright (C) 2022 Apple Inc. All Rights Reserved.
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

#include "ControlPart.h"
#include <wtf/Seconds.h>

namespace WebCore {

class ProgressBarPart : public ControlPart {
public:
    static Ref<ProgressBarPart> create();
    WEBCORE_EXPORT static Ref<ProgressBarPart> create(double position, const Seconds& animationStartTime);

    double position() const { return m_position; }
    void setPosition(double position) { m_position = position; }

    Seconds animationStartTime() const { return m_animationStartTime; }
    void setAnimationStartTime(Seconds animationStartTime) { m_animationStartTime = animationStartTime; }

private:
    ProgressBarPart(double position, const Seconds& animationStartTime);

    std::unique_ptr<PlatformControl> createPlatformControl() override;

    double m_position;
    Seconds m_animationStartTime;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_CONTROL_PART(ProgressBar)
