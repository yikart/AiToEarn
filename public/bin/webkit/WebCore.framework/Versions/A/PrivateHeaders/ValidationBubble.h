/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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

#include "IntRect.h"
#include <wtf/Forward.h>
#include <wtf/text/WTFString.h>

#if PLATFORM(COCOA)
#include <wtf/RetainPtr.h>
#include <wtf/WeakObjCPtr.h>
#endif

#if PLATFORM(MAC)
OBJC_CLASS NSPopover;
#elif PLATFORM(IOS_FAMILY)
OBJC_CLASS UIViewController;
OBJC_CLASS WebValidationBubbleDelegate;
OBJC_CLASS WebValidationBubbleTapRecognizer;
OBJC_CLASS WebValidationBubbleViewController;
#endif

#if PLATFORM(MAC)
OBJC_CLASS NSView;
using PlatformView = NSView;
#elif PLATFORM(IOS_FAMILY)
OBJC_CLASS UIView;
using PlatformView = UIView;
#elif PLATFORM(GTK)
using PlatformView = GtkWidget;
#else
using PlatformView = void;
#endif

namespace WebCore {

class ValidationBubble : public RefCounted<ValidationBubble> {
public:
    struct Settings {
        double minimumFontSize { 0 };
    };

#if PLATFORM(GTK)
    using ShouldNotifyFocusEventsCallback = Function<void(PlatformView*, bool shouldNotifyFocusEvents)>;
    static Ref<ValidationBubble> create(PlatformView* view, const String& message, const Settings& settings, ShouldNotifyFocusEventsCallback&& callback)
    {
        return adoptRef(*new ValidationBubble(view, message, settings, WTFMove(callback)));
    }
#else
    static Ref<ValidationBubble> create(PlatformView* view, const String& message, const Settings& settings)
    {
        return adoptRef(*new ValidationBubble(view, message, settings));
    }
#endif

    WEBCORE_EXPORT ~ValidationBubble();

    const String& message() const { return m_message; }
    double fontSize() const { return m_fontSize; }

#if PLATFORM(IOS_FAMILY)
    WEBCORE_EXPORT void setAnchorRect(const IntRect& anchorRect, UIViewController* presentingViewController = nullptr);
    WEBCORE_EXPORT void show();
#else
    WEBCORE_EXPORT void showRelativeTo(const IntRect& anchorRect);
#endif

private:
#if PLATFORM(GTK)
    WEBCORE_EXPORT ValidationBubble(PlatformView*, const String& message, const Settings&, ShouldNotifyFocusEventsCallback&&);
    void invalidate();
#else
    WEBCORE_EXPORT ValidationBubble(PlatformView*, const String& message, const Settings&);
#endif

    PlatformView* m_view;
    String m_message;
    double m_fontSize { 0 };
#if PLATFORM(MAC)
    RetainPtr<NSPopover> m_popover;
#elif PLATFORM(IOS_FAMILY)
    RetainPtr<WebValidationBubbleViewController> m_popoverController;
    RetainPtr<WebValidationBubbleTapRecognizer> m_tapRecognizer;
    RetainPtr<WebValidationBubbleDelegate> m_popoverDelegate;
    WeakObjCPtr<UIViewController> m_presentingViewController;
    bool m_startingToPresentViewController { false };
#elif PLATFORM(GTK)
    GtkWidget* m_popover { nullptr };
    ShouldNotifyFocusEventsCallback m_shouldNotifyFocusEventsCallback { nullptr };
#endif
};

}
