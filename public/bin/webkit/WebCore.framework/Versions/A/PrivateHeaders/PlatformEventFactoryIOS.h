/*
 * Copyright (C) 2011 Apple Inc. All rights reserved.
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

#if PLATFORM(IOS_FAMILY)

#include "PlatformKeyboardEvent.h"
#include "PlatformMouseEvent.h"
#include "PlatformWheelEvent.h"

#if USE(APPLE_INTERNAL_SDK)
#include <WebKitAdditions/PlatformTouchEventIOS.h>
#endif

OBJC_CLASS WebEvent;

namespace WebCore {

class PlatformEventFactory {
public:
    WEBCORE_EXPORT static PlatformMouseEvent createPlatformMouseEvent(WebEvent *);
    WEBCORE_EXPORT static PlatformWheelEvent createPlatformWheelEvent(WebEvent *);
    WEBCORE_EXPORT static PlatformKeyboardEvent createPlatformKeyboardEvent(WebEvent *);
#if ENABLE(TOUCH_EVENTS) || ENABLE(IOS_TOUCH_EVENTS)
    static PlatformTouchEvent createPlatformTouchEvent(WebEvent *);
    static PlatformTouchEvent createPlatformSimulatedTouchEvent(PlatformEvent::Type, IntPoint location);
#endif
};

WEBCORE_EXPORT String keyForKeyEvent(WebEvent *);
WEBCORE_EXPORT String codeForKeyEvent(WebEvent *);
WEBCORE_EXPORT String keyIdentifierForKeyEvent(WebEvent *);
WEBCORE_EXPORT int windowsKeyCodeForKeyEvent(WebEvent*);

} // namespace WebCore

#endif // PLATFORM(IOS_FAMILY)
