/*
 * Copyright (C) 2006-2018 Apple Inc. All rights reserved.
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

#include "ContentsFormat.h"
#include <wtf/Forward.h>

#if PLATFORM(MAC)
OBJC_CLASS NSScreen;
OBJC_CLASS NSWindow;
#ifdef NSGEOMETRY_TYPES_SAME_AS_CGGEOMETRY_TYPES
typedef struct CGRect NSRect;
typedef struct CGPoint NSPoint;
#else
typedef struct _NSRect NSRect;
typedef struct _NSPoint NSPoint;
#endif
#endif

#if PLATFORM(IOS_FAMILY)
OBJC_CLASS UIScreen;
#endif

#if USE(CG)
typedef struct CGColorSpace *CGColorSpaceRef;
#endif

// X11 headers define a bunch of macros with common terms, interfering with WebCore and WTF enum values.
// As a workaround, we explicitly undef them here.
#if defined(None)
#undef None
#endif

namespace WebCore {

class DestinationColorSpace;
class FloatRect;
class FloatSize;
class PlatformCALayerClient;
class Widget;

using PlatformDisplayID = uint32_t;

using PlatformGPUID = uint64_t; // On MAC, global IOKit registryID that can identify a GPU across process boundaries.

int screenDepth(Widget*);
int screenDepthPerComponent(Widget*);
bool screenIsMonochrome(Widget*);
WEBCORE_EXPORT DestinationColorSpace screenColorSpace(Widget* = nullptr);

bool screenHasInvertedColors();

#if USE(GLIB)
double fontDPI(); // dpi to use for font scaling
double screenDPI(PlatformDisplayID); // dpi of the display device, corrected for device scaling
#endif

FloatRect screenRect(Widget*);
FloatRect screenAvailableRect(Widget*);

WEBCORE_EXPORT ContentsFormat screenContentsFormat(Widget* = nullptr, PlatformCALayerClient* = nullptr);
WEBCORE_EXPORT bool screenSupportsExtendedColor(Widget* = nullptr);

enum class DynamicRangeMode : uint8_t {
    None,
    Standard,
    HLG,
    HDR10,
    DolbyVisionPQ,
};
#if HAVE(AVPLAYER_VIDEORANGEOVERRIDE)
WEBCORE_EXPORT DynamicRangeMode preferredDynamicRangeMode(Widget* = nullptr);
#else
constexpr DynamicRangeMode preferredDynamicRangeMode(Widget* = nullptr) { return DynamicRangeMode::Standard; }
#endif

#if PLATFORM(MAC) || PLATFORM(IOS_FAMILY)
WEBCORE_EXPORT bool screenSupportsHighDynamicRange(Widget* = nullptr);
#else
constexpr bool screenSupportsHighDynamicRange(Widget* = nullptr) { return false; }
#endif

struct ScreenProperties;
struct ScreenData;
    
WEBCORE_EXPORT ScreenProperties collectScreenProperties();
WEBCORE_EXPORT void setScreenProperties(const ScreenProperties&);
const ScreenProperties& getScreenProperties();
WEBCORE_EXPORT const ScreenData* screenData(PlatformDisplayID screendisplayID);
WEBCORE_EXPORT PlatformDisplayID primaryScreenDisplayID();
    
#if PLATFORM(MAC)

WEBCORE_EXPORT PlatformDisplayID displayID(NSScreen *);

WEBCORE_EXPORT NSScreen *screen(NSWindow *);
NSScreen *screen(PlatformDisplayID);

FloatRect screenRectForDisplay(PlatformDisplayID);
WEBCORE_EXPORT FloatRect screenRectForPrimaryScreen();
WEBCORE_EXPORT FloatRect availableScreenRect(NSScreen *);

WEBCORE_EXPORT FloatRect toUserSpace(const NSRect&, NSWindow *destination);
WEBCORE_EXPORT FloatRect toUserSpaceForPrimaryScreen(const NSRect&);
WEBCORE_EXPORT NSRect toDeviceSpace(const FloatRect&, NSWindow *source);

NSPoint flipScreenPoint(const NSPoint&, NSScreen *);

WEBCORE_EXPORT void setShouldOverrideScreenSupportsHighDynamicRange(bool shouldOverride, bool supportsHighDynamicRange);

uint32_t primaryOpenGLDisplayMask();
uint32_t displayMaskForDisplay(PlatformDisplayID);

PlatformGPUID primaryGPUID();
PlatformGPUID gpuIDForDisplay(PlatformDisplayID);
PlatformGPUID gpuIDForDisplayMask(uint32_t);

WEBCORE_EXPORT FloatRect safeScreenFrame(NSScreen *);

#endif // !PLATFORM(MAC)

#if PLATFORM(IOS_FAMILY)

float screenPPIFactor();
WEBCORE_EXPORT FloatSize screenSize();
WEBCORE_EXPORT FloatSize availableScreenSize();
WEBCORE_EXPORT FloatSize overrideScreenSize();
WEBCORE_EXPORT FloatSize overrideAvailableScreenSize();
WEBCORE_EXPORT float screenScaleFactor(UIScreen * = nullptr);

#endif

#if ENABLE(TOUCH_EVENTS)
WEBCORE_EXPORT void setScreenHasTouchDeviceOverride(bool);

WEBCORE_EXPORT bool screenHasTouchDevice();
WEBCORE_EXPORT bool screenIsTouchPrimaryInputDevice();
#if PLATFORM(GTK) || PLATFORM(WPE)
bool platformScreenHasTouchDevice();
bool platformScreenIsTouchPrimaryInputDevice();
#else
constexpr bool platformScreenHasTouchDevice() { return true; }
constexpr bool platformScreenIsTouchPrimaryInputDevice() { return true; }
#endif
#endif

} // namespace WebCore
