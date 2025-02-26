/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
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

#include "DestinationColorSpace.h"
#include "FloatRect.h"
#include "PlatformScreen.h"
#include <wtf/HashMap.h>
#include <wtf/RetainPtr.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

struct ScreenData {
    FloatRect screenAvailableRect;
    FloatRect screenRect;
    DestinationColorSpace colorSpace { DestinationColorSpace::SRGB() };
    int screenDepth { 0 };
    int screenDepthPerComponent { 0 };
    bool screenSupportsExtendedColor { false };
    bool screenHasInvertedColors { false };
    bool screenSupportsHighDynamicRange { false };
#if PLATFORM(MAC)
    FloatSize screenSize; // In millimeters.
    bool screenIsMonochrome { false };
    uint32_t displayMask { 0 };
    PlatformGPUID gpuID { 0 };
    DynamicRangeMode preferredDynamicRangeMode { DynamicRangeMode::Standard };
    WEBCORE_EXPORT double screenDPI() const;
#endif
#if PLATFORM(GTK) || (PLATFORM(WPE) && ENABLE(WPE_PLATFORM))
    IntSize screenSize; // In millimeters.
    double dpi; // Already corrected for device scaling.
#endif

#if PLATFORM(MAC) || PLATFORM(IOS_FAMILY)
    float scaleFactor { 1 };
#endif
};

using ScreenDataMap = HashMap<PlatformDisplayID, ScreenData>;

struct ScreenProperties {
    PlatformDisplayID primaryDisplayID { 0 };
    ScreenDataMap screenDataMap;
};

} // namespace WebCore
