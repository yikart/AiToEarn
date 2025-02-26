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

#include "PlatformColorSpace.h"
#include <optional>
#include <wtf/Forward.h>

namespace WebCore {

class DestinationColorSpace {
public:
    WEBCORE_EXPORT static const DestinationColorSpace& SRGB();
    WEBCORE_EXPORT static const DestinationColorSpace& LinearSRGB();
#if ENABLE(DESTINATION_COLOR_SPACE_DISPLAY_P3)
    WEBCORE_EXPORT static const DestinationColorSpace& DisplayP3();
#endif

    explicit DestinationColorSpace(PlatformColorSpace platformColorSpace)
        : m_platformColorSpace { WTFMove(platformColorSpace) }
    {
#if USE(CG) || USE(SKIA)
        ASSERT(m_platformColorSpace);
#endif
    }

#if USE(SKIA)
    PlatformColorSpaceValue platformColorSpace() const { return m_platformColorSpace; }
#else
    PlatformColorSpaceValue platformColorSpace() const { return m_platformColorSpace.get(); }
#endif

    PlatformColorSpace serializableColorSpace() const { return m_platformColorSpace; }

    WEBCORE_EXPORT std::optional<DestinationColorSpace> asRGB() const;

    WEBCORE_EXPORT bool supportsOutput() const;

    bool usesExtendedRange() const;
    bool usesRec2100TransferFunctions() const;
    bool usesStandardRange() const { return !usesExtendedRange() && !usesRec2100TransferFunctions(); }

private:
    PlatformColorSpace m_platformColorSpace;
};

WEBCORE_EXPORT bool operator==(const DestinationColorSpace&, const DestinationColorSpace&);

WEBCORE_EXPORT TextStream& operator<<(TextStream&, const DestinationColorSpace&);
}
