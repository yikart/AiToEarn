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

#include "GraphicsLayer.h"

namespace WebCore {

class FloatRect;
class GraphicsContext;
class PlatformCALayer;

class PlatformCALayerClient {
public:
    virtual PlatformLayerIdentifier platformCALayerIdentifier() const = 0;

    virtual void platformCALayerLayoutSublayersOfLayer(PlatformCALayer*) { }
    virtual bool platformCALayerRespondsToLayoutChanges() const { return false; }

    virtual void platformCALayerCustomSublayersChanged(PlatformCALayer*) { }

    virtual void platformCALayerAnimationStarted(const String& /*animationKey*/, MonotonicTime) { }
    virtual void platformCALayerAnimationEnded(const String& /*animationKey*/) { }
    virtual GraphicsLayer::CompositingCoordinatesOrientation platformCALayerContentsOrientation() const { return GraphicsLayer::CompositingCoordinatesOrientation::TopDown; }
    virtual void platformCALayerPaintContents(PlatformCALayer*, GraphicsContext&, const FloatRect& inClip, OptionSet<GraphicsLayerPaintBehavior>) = 0;
    virtual bool platformCALayerShowDebugBorders() const { return false; }
    virtual bool platformCALayerShowRepaintCounter(PlatformCALayer*) const { return false; }
    virtual int platformCALayerRepaintCount(PlatformCALayer*) const { return 0; }
    virtual int platformCALayerIncrementRepaintCount(PlatformCALayer*) { return 0; }
    
    virtual bool platformCALayerContentsOpaque() const = 0;
    virtual bool platformCALayerDrawsContent() const = 0;
    virtual bool platformCALayerDelegatesDisplay(PlatformCALayer*) const { return false; };
    virtual void platformCALayerLayerDisplay(PlatformCALayer*) { }
    virtual void platformCALayerLayerDidDisplay(PlatformCALayer*) { }

    virtual bool platformCALayerRenderingIsSuppressedIncludingDescendants() const { return false; }

    virtual void platformCALayerSetNeedsToRevalidateTiles() { }
    virtual float platformCALayerDeviceScaleFactor() const = 0;
    virtual float platformCALayerContentsScaleMultiplierForNewTiles(PlatformCALayer*) const { return 1; }

    virtual bool platformCALayerShouldAggressivelyRetainTiles(PlatformCALayer*) const { return false; }
    virtual bool platformCALayerShouldTemporarilyRetainTileCohorts(PlatformCALayer*) const { return true; }

    virtual bool platformCALayerUseGiantTiles() const { return false; }
    virtual bool platformCALayerCSSUnprefixedBackdropFilterEnabled() const { return false; }

    virtual bool isCommittingChanges() const { return false; }

    virtual bool isUsingDisplayListDrawing(PlatformCALayer*) const { return false; }

#if HAVE(HDR_SUPPORT)
    virtual bool hdrForImagesEnabled() const { return false; }
#endif

    virtual void platformCALayerLogFilledVisibleFreshTile(unsigned /* blankPixelCount */) { }

    virtual bool platformCALayerContainsBitmapOnly(const PlatformCALayer*) const { return false; }

    virtual bool platformCALayerShouldPaintUsingCompositeCopy() const { return false; }

    virtual bool platformCALayerNeedsPlatformContext(const PlatformCALayer*) const { return false; }

protected:
    virtual ~PlatformCALayerClient() = default;
};

}

