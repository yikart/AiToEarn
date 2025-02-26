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

#if ENABLE(APPLE_PAY)

#include "SystemImage.h"
#include <optional>
#include <wtf/Forward.h>
#include <wtf/Ref.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

enum class ApplePayLogoStyle : bool {
    White,
    Black,
};

class WEBCORE_EXPORT ApplePayLogoSystemImage final : public SystemImage {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(ApplePayLogoSystemImage, WEBCORE_EXPORT);
public:
    static Ref<ApplePayLogoSystemImage> create(ApplePayLogoStyle applePayLogoStyle)
    {
        return adoptRef(*new ApplePayLogoSystemImage(applePayLogoStyle));
    }

    virtual ~ApplePayLogoSystemImage() = default;

    ApplePayLogoStyle applePayLogoStyle() const { return m_applePayLogoStyle; }

    void draw(GraphicsContext&, const FloatRect&) const final;

private:
    ApplePayLogoSystemImage(ApplePayLogoStyle applePayLogoStyle)
        : SystemImage(SystemImageType::ApplePayLogo)
        , m_applePayLogoStyle(applePayLogoStyle)
    {
    }

    ApplePayLogoStyle m_applePayLogoStyle;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::ApplePayLogoSystemImage)
    static bool isType(const WebCore::SystemImage& systemImage) { return systemImage.systemImageType() == WebCore::SystemImageType::ApplePayLogo; }
SPECIALIZE_TYPE_TRAITS_END()

#endif // ENABLE(APPLE_PAY)
