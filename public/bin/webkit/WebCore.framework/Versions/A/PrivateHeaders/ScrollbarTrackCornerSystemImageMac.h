/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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

#if USE(APPKIT)

#include "AppKitControlSystemImage.h"
#include <optional>
#include <wtf/Forward.h>
#include <wtf/Ref.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class WEBCORE_EXPORT ScrollbarTrackCornerSystemImageMac final : public AppKitControlSystemImage {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(ScrollbarTrackCornerSystemImageMac, WEBCORE_EXPORT);
public:
    static Ref<ScrollbarTrackCornerSystemImageMac> create();
    static Ref<ScrollbarTrackCornerSystemImageMac> create(WebCore::Color&& tintColor, bool useDarkAppearance);

    virtual ~ScrollbarTrackCornerSystemImageMac() = default;

    void drawControl(GraphicsContext&, const FloatRect&) const final;

private:
    ScrollbarTrackCornerSystemImageMac();
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::ScrollbarTrackCornerSystemImageMac)
    static bool isType(const WebCore::AppKitControlSystemImage& systemImage) { return systemImage.controlType() == WebCore::AppKitControlSystemImageType::ScrollbarTrackCorner; }
SPECIALIZE_TYPE_TRAITS_END()

#endif // USE(APPKIT)
