/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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

#include "KeyboardEvent.h"
#include "KeyboardScroll.h" // FIXME: This is a layering violation.
#include "RectEdges.h"
#include "ScrollableArea.h"
#include <wtf/CheckedPtr.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class PlatformKeyboardEvent;

enum class KeyboardScrollingKey : uint8_t {
    LeftArrow,
    RightArrow,
    UpArrow,
    DownArrow,
    Space,
    PageUp,
    PageDown,
    Home,
    End
};

const std::optional<KeyboardScrollingKey> keyboardScrollingKeyForKeyboardEvent(const KeyboardEvent&);
const std::optional<ScrollDirection> scrollDirectionForKeyboardEvent(const KeyboardEvent&);
const std::optional<ScrollGranularity> scrollGranularityForKeyboardEvent(const KeyboardEvent&);

class KeyboardScrollingAnimator final : public CanMakeWeakPtr<KeyboardScrollingAnimator>, public CanMakeCheckedPtr<KeyboardScrollingAnimator> {
    WTF_MAKE_TZONE_ALLOCATED(KeyboardScrollingAnimator);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(KeyboardScrollingAnimator);
    WTF_MAKE_NONCOPYABLE(KeyboardScrollingAnimator);
public:
    KeyboardScrollingAnimator(ScrollableArea&);

    WEBCORE_EXPORT bool beginKeyboardScrollGesture(ScrollDirection, ScrollGranularity, bool isKeyRepeat);
    WEBCORE_EXPORT void handleKeyUpEvent();
    WEBCORE_EXPORT void stopScrollingImmediately();

private:
    std::optional<KeyboardScroll> makeKeyboardScroll(ScrollDirection, ScrollGranularity) const;
    float scrollDistance(ScrollDirection, ScrollGranularity) const;
    RectEdges<bool> scrollingDirections() const;

    ScrollableArea& m_scrollableArea;
    bool m_scrollTriggeringKeyIsPressed { false };
};

} // namespace WebCore
