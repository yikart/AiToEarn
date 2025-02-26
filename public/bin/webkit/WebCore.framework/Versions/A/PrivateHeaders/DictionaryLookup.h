/*
 * Copyright (C) 2014-2018 Apple Inc. All rights reserved.
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

#if PLATFORM(COCOA)

#include "DictionaryPopupInfo.h"
#include <wtf/Function.h>

#if PLATFORM(MAC)
#import <pal/spi/mac/NSImmediateActionGestureRecognizerSPI.h>
#endif

@class NSView;
@class PDFSelection;
@class UIView;

#if PLATFORM(MAC)
using WKRevealController = id <NSImmediateActionAnimationController>;
using CocoaView = NSView;
#else
using WKRevealController = id;
using CocoaView = UIView;
#endif

namespace WebCore {

class HitTestResult;
class VisibleSelection;

struct SimpleRange;

class DictionaryLookup {
public:
    WEBCORE_EXPORT static std::optional<SimpleRange> rangeForSelection(const VisibleSelection&);
    WEBCORE_EXPORT static std::optional<SimpleRange> rangeAtHitTestResult(const HitTestResult&);
    WEBCORE_EXPORT static NSString *stringForPDFSelection(PDFSelection *);

    // FIXME: Should move/unify dictionaryPopupInfoForRange here too.

    WEBCORE_EXPORT static void showPopup(const DictionaryPopupInfo&, CocoaView *, const Function<void(TextIndicator&)>& textIndicatorInstallationCallback, const Function<FloatRect(FloatRect)>& rootViewToViewConversionCallback = nullptr, Function<void()>&& clearTextIndicator = nullptr);
    WEBCORE_EXPORT static void hidePopup();
    
#if PLATFORM(MAC)
    WEBCORE_EXPORT static WKRevealController animationControllerForPopup(const DictionaryPopupInfo&, NSView *, const Function<void(TextIndicator&)>& textIndicatorInstallationCallback, const Function<FloatRect(FloatRect)>& rootViewToViewConversionCallback = nullptr, Function<void()>&& clearTextIndicator = nullptr);
#endif
};

} // namespace WebCore

#endif // PLATFORM(COCOA)
