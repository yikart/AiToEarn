/*
 * Copyright (C) 2008-2020 Apple Inc.  All rights reserved.
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

#include "GraphicsClient.h"
#include "Widget.h"
#include <wtf/TZoneMallocInlines.h>

#if PLATFORM(IOS_FAMILY)
OBJC_CLASS NSData;
#endif

namespace WebCore {

class Cursor;

using FramesPerSecond = unsigned;

class HostWindow : public GraphicsClient {
    WTF_MAKE_TZONE_ALLOCATED_INLINE(HostWindow);
    WTF_MAKE_NONCOPYABLE(HostWindow);
public:
    HostWindow() = default;
    virtual ~HostWindow() = default;

    // Requests the host invalidate the root view, not the contents.
    virtual void invalidateRootView(const IntRect& updateRect) = 0;

    // Requests the host invalidate the contents and the root view.
    virtual void invalidateContentsAndRootView(const IntRect& updateRect) = 0;

    // Requests the host scroll backingstore by the specified delta, rect to scroll, and clip rect.
    virtual void scroll(const IntSize& scrollDelta, const IntRect& rectToScroll, const IntRect& clipRect) = 0;

    // Requests the host invalidate the contents, not the root view. This is the slow path for scrolling.
    virtual void invalidateContentsForSlowScroll(const IntRect& updateRect) = 0;

    // Methods for doing coordinate conversions to and from screen coordinates.
    virtual IntPoint screenToRootView(const IntPoint&) const = 0;
    virtual IntRect rootViewToScreen(const IntRect&) const = 0;
    virtual IntPoint accessibilityScreenToRootView(const IntPoint&) const = 0;
    virtual IntRect rootViewToAccessibilityScreen(const IntRect&) const = 0;
#if PLATFORM(IOS_FAMILY)
    virtual void relayAccessibilityNotification(const String&, const RetainPtr<NSData>&) const = 0;
#endif

    // Method for retrieving the native client of the page.
    virtual PlatformPageClient platformPageClient() const = 0;
    
    // Request that the cursor change.
    virtual void setCursor(const Cursor&) = 0;

    virtual void setCursorHiddenUntilMouseMoves(bool) = 0;

    virtual void windowScreenDidChange(PlatformDisplayID, std::optional<FramesPerSecond> nominalFramesPerSecond) = 0;

    virtual FloatSize screenSize() const = 0;
    virtual FloatSize availableScreenSize() const = 0;
    virtual FloatSize overrideScreenSize() const = 0;
    virtual FloatSize overrideAvailableScreenSize() const = 0;
};

} // namespace WebCore
