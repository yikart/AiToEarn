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
#include <wtf/RefCounted.h>

#if !USE(CA)
#include "PlatformLayer.h"
#endif
namespace WebCore {
class ImageBuffer;
#if USE(CA)
class PlatformCALayer;
#endif

// Platform specific interface for attaching contents to GraphicsLayer.
// Responsible for creating compositor resources to show the particular contents
// in the platform specific GraphicsLayer.
class WEBCORE_EXPORT GraphicsLayerContentsDisplayDelegate : public RefCounted<GraphicsLayerContentsDisplayDelegate> {
public:
    virtual ~GraphicsLayerContentsDisplayDelegate();

#if USE(CA)
    virtual void prepareToDelegateDisplay(PlatformCALayer&);
    // Must not detach the platform layer backing store.
    virtual void display(PlatformCALayer&) = 0;
    virtual GraphicsLayer::CompositingCoordinatesOrientation orientation() const;
#else
    virtual PlatformLayer* platformLayer() const = 0;
#endif
};

class GraphicsLayerAsyncContentsDisplayDelegate : public GraphicsLayerContentsDisplayDelegate {
public:
    virtual ~GraphicsLayerAsyncContentsDisplayDelegate() = default;

    virtual bool WEBCORE_EXPORT tryCopyToLayer(ImageBuffer&) = 0;

    virtual bool isGraphicsLayerAsyncContentsDisplayDelegateCocoa() const { return false; }
    virtual bool isGraphicsLayerCARemoteAsyncContentsDisplayDelegate() const { return false; }
};

}
