/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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

#include "PlatformXR.h"
#include "WebGPUTextureFormat.h"
#include "WebGPUTextureUsage.h"
#include "WebGPUXREye.h"
#include "WebGPUXRProjectionLayer.h"
#include "WebGPUXRSubImage.h"

#include <wtf/Ref.h>
#include <wtf/RefCountedAndCanMakeWeakPtr.h>
#include <wtf/WeakPtr.h>

namespace WTF {
class MachSendRight;
}

namespace WebCore {
class WebXRRigidTransform;
}

namespace WebCore::WebGPU {

class Device;
class XRGPUSubImage;
class XRProjectionLayer;
class XRFrame;
class XRView;

struct XRProjectionLayerInit {
    TextureFormat colorFormat;
    std::optional<TextureFormat> depthStencilFormat;
    TextureUsageFlags textureUsage { TextureUsage::RenderAttachment };
    double scaleFactor { 1.0 };
};

class XRProjectionLayer : public RefCountedAndCanMakeWeakPtr<XRProjectionLayer> {
public:
    virtual ~XRProjectionLayer() = default;

    virtual uint32_t textureWidth() const = 0;
    virtual uint32_t textureHeight() const = 0;
    virtual uint32_t textureArrayLength() const = 0;

    virtual bool ignoreDepthValues() const = 0;
    virtual std::optional<float> fixedFoveation() const = 0;
    virtual void setFixedFoveation(std::optional<float>) = 0;
    virtual WebXRRigidTransform* deltaPose() const = 0;
    virtual void setDeltaPose(WebXRRigidTransform*) = 0;

    // WebXRLayer
#if PLATFORM(COCOA)
    virtual void startFrame(size_t frameIndex, MachSendRight&& colorBuffer, MachSendRight&& depthBuffer, MachSendRight&& completionSyncEvent, size_t reusableTextureIndex) = 0;
#endif
    virtual void endFrame() = 0;

protected:
    XRProjectionLayer() = default;

private:
    XRProjectionLayer(const XRProjectionLayer&) = delete;
    XRProjectionLayer(XRProjectionLayer&&) = delete;
    XRProjectionLayer& operator=(const XRProjectionLayer&) = delete;
    XRProjectionLayer& operator=(XRProjectionLayer&&) = delete;
};

} // namespace WebCore::WebGPU
