/*
 * Copyright (C) 2014 Apple Inc. All rights reserved.
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

#include "DebugOverlayRegions.h"
#include "LocalFrame.h"
#include <wtf/HashMap.h>
#include <wtf/OptionSet.h>
#include <wtf/Vector.h>
#include <wtf/WeakHashMap.h>

namespace WebCore {

class Page;
class RegionOverlay;

class DebugPageOverlays {
public:
    static DebugPageOverlays& singleton();

    enum class RegionType : uint8_t {
        WheelEventHandlers,
        NonFastScrollableRegion,
        InteractionRegion,
        SiteIsolationRegion
    };
    static constexpr unsigned NumberOfRegionTypes = static_cast<unsigned>(RegionType::SiteIsolationRegion) + 1;

    static void didLayout(LocalFrame&);
    static void didChangeEventHandlers(LocalFrame&);
    static void doAfterUpdateRendering(Page&);

    static bool shouldPaintOverlayIntoLayerForRegionType(Page&, RegionType);

    WEBCORE_EXPORT static void settingsChanged(Page&);

private:
    static bool hasOverlays(Page&);

    void showRegionOverlay(Page&, RegionType);
    void hideRegionOverlay(Page&, RegionType);

    void updateRegionIfNecessary(Page&, RegionType);

    void regionChanged(LocalFrame&, RegionType);

    bool hasOverlaysForPage(Page&) const;
    
    void updateOverlayRegionVisibility(Page&, OptionSet<DebugOverlayRegions>);

    bool shouldPaintOverlayIntoLayer(Page&, RegionType) const;

    RegionOverlay* regionOverlayForPage(Page&, RegionType) const;
    RegionOverlay& ensureRegionOverlayForPage(Page&, RegionType);

    WeakHashMap<Page, Vector<RefPtr<RegionOverlay>>> m_pageRegionOverlays;

    static DebugPageOverlays* sharedDebugOverlays;
};

#define FAST_RETURN_IF_NO_OVERLAYS(page) if (LIKELY(!page || !hasOverlays(*page))) return;

inline bool DebugPageOverlays::hasOverlays(Page& page)
{
    if (!sharedDebugOverlays)
        return false;

    return sharedDebugOverlays->hasOverlaysForPage(page);
}

inline void DebugPageOverlays::didLayout(LocalFrame& frame)
{
    FAST_RETURN_IF_NO_OVERLAYS(frame.page());

    sharedDebugOverlays->regionChanged(frame, RegionType::WheelEventHandlers);
    sharedDebugOverlays->regionChanged(frame, RegionType::NonFastScrollableRegion);
    sharedDebugOverlays->regionChanged(frame, RegionType::InteractionRegion);
    sharedDebugOverlays->regionChanged(frame, RegionType::SiteIsolationRegion);
}

inline void DebugPageOverlays::didChangeEventHandlers(LocalFrame& frame)
{
    FAST_RETURN_IF_NO_OVERLAYS(frame.page());

    sharedDebugOverlays->regionChanged(frame, RegionType::WheelEventHandlers);
    sharedDebugOverlays->regionChanged(frame, RegionType::NonFastScrollableRegion);
    sharedDebugOverlays->regionChanged(frame, RegionType::InteractionRegion);
    sharedDebugOverlays->regionChanged(frame, RegionType::SiteIsolationRegion);
}

inline void DebugPageOverlays::doAfterUpdateRendering(Page& page)
{
    if (LIKELY(!hasOverlays(page)))
        return;

    sharedDebugOverlays->updateRegionIfNecessary(page, RegionType::WheelEventHandlers);
    sharedDebugOverlays->updateRegionIfNecessary(page, RegionType::NonFastScrollableRegion);
    sharedDebugOverlays->updateRegionIfNecessary(page, RegionType::InteractionRegion);
    sharedDebugOverlays->updateRegionIfNecessary(page, RegionType::SiteIsolationRegion);
}

inline bool DebugPageOverlays::shouldPaintOverlayIntoLayerForRegionType(Page& page, RegionType regionType)
{
    if (LIKELY(!hasOverlays(page)))
        return false;
    return sharedDebugOverlays->shouldPaintOverlayIntoLayer(page, regionType);
}

} // namespace WebCore
