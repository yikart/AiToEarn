/*
 * Copyright (C) 2022-2023 Apple Inc. All rights reserved.
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

#if USE(SYSTEM_PREVIEW)

#include "Image.h"
#include "NativeImage.h"
#include "SystemImage.h"
#include <optional>
#include <wtf/ArgumentCoder.h>
#include <wtf/Forward.h>
#include <wtf/Ref.h>
#include <wtf/RefPtr.h>
#include <wtf/TZoneMalloc.h>

OBJC_CLASS CIContext;

namespace WebCore {

class WEBCORE_EXPORT ARKitBadgeSystemImage final : public SystemImage {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(ARKitBadgeSystemImage, WEBCORE_EXPORT);
public:
    static Ref<ARKitBadgeSystemImage> create(Image& image)
    {
        return adoptRef(*new ARKitBadgeSystemImage(image));
    }

    static Ref<ARKitBadgeSystemImage> create(RenderingResourceIdentifier renderingResourceIdentifier, FloatSize size)
    {
        return adoptRef(*new ARKitBadgeSystemImage(renderingResourceIdentifier, size));
    }

    virtual ~ARKitBadgeSystemImage() = default;

    void draw(GraphicsContext&, const FloatRect&) const final;

    Image* image() const { return m_image.get(); }
    void setImage(Image& image) { m_image = &image; }

    RenderingResourceIdentifier imageIdentifier() const;

private:
    friend struct IPC::ArgumentCoder<ARKitBadgeSystemImage, void>;
    ARKitBadgeSystemImage(Image& image)
        : SystemImage(SystemImageType::ARKitBadge)
        , m_image(&image)
        , m_imageSize(image.size())
    {
    }

    ARKitBadgeSystemImage(RenderingResourceIdentifier renderingResourceIdentifier, FloatSize size)
        : SystemImage(SystemImageType::ARKitBadge)
        , m_renderingResourceIdentifier(renderingResourceIdentifier)
        , m_imageSize(size)
    {
    }

    RefPtr<Image> m_image;
    Markable<RenderingResourceIdentifier> m_renderingResourceIdentifier;
    FloatSize m_imageSize;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::ARKitBadgeSystemImage)
    static bool isType(const WebCore::SystemImage& systemImage) { return systemImage.systemImageType() == WebCore::SystemImageType::ARKitBadge; }
SPECIALIZE_TYPE_TRAITS_END()

#endif // USE(SYSTEM_PREVIEW)
