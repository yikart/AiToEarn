/*
 * Copyright (C) 2004-2022 Apple Inc. All rights reserved.
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

#include "CaretAnimator.h"
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class SimpleCaretAnimator final : public CaretAnimator {
    WTF_MAKE_TZONE_ALLOCATED(SimpleCaretAnimator);
public:
    explicit SimpleCaretAnimator(CaretAnimationClient&);

private:
    void updateAnimationProperties() final;
    void start() final;

    String debugDescription() const final;

    void setVisible(bool visible) final { setBlinkState(visible ? PresentationProperties::BlinkState::On : PresentationProperties::BlinkState::Off); }

    void setBlinkState(PresentationProperties::BlinkState blinkState)
    { 
        if (m_presentationProperties.blinkState == blinkState)
            return;

        m_presentationProperties.blinkState = blinkState; 
        m_client.caretAnimationDidUpdate(*this);
    }

    MonotonicTime m_lastTimeCaretPaintWasToggled;
};

} // namespace WebCore
