/*
 * Copyright (C) 2006-2021 Apple Inc.  All rights reserved.
 * Copyright (C) 2008 Eric Seidel <eric@webkit.org>
 * Copyright (C) 2007-2008 Torch Mobile, Inc.
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

#include "AffineTransform.h"
#include "SourceImage.h"

#include <wtf/Ref.h>
#include <wtf/RefCounted.h>

#if USE(CG)
typedef struct CGPattern* CGPatternRef;
typedef RetainPtr<CGPatternRef> PlatformPatternPtr;
#elif USE(CAIRO)
typedef struct _cairo_pattern cairo_pattern_t;
typedef cairo_pattern_t* PlatformPatternPtr;
#elif USE(SKIA)
WTF_IGNORE_WARNINGS_IN_THIRD_PARTY_CODE_BEGIN
#include <skia/core/SkShader.h>
WTF_IGNORE_WARNINGS_IN_THIRD_PARTY_CODE_END
typedef sk_sp<SkShader> PlatformPatternPtr;
#endif

namespace WebCore {

class GraphicsContext;

class Pattern final : public ThreadSafeRefCounted<Pattern> {
public:
    struct Parameters {
        Parameters(bool repeatX = true, bool repeatY = true, AffineTransform patternSpaceTransform = { })
            : repeatX(repeatX)
            , repeatY(repeatY)
            , patternSpaceTransform(patternSpaceTransform)
        {
        }
        bool repeatX;
        bool repeatY;
        AffineTransform patternSpaceTransform;
    };

    WEBCORE_EXPORT static Ref<Pattern> create(SourceImage&& tileImage, const Parameters& = { });
    WEBCORE_EXPORT ~Pattern();

    WEBCORE_EXPORT const SourceImage& tileImage() const;
    WEBCORE_EXPORT void setTileImage(SourceImage&&);

    RefPtr<NativeImage> tileNativeImage() const;
    RefPtr<ImageBuffer> tileImageBuffer() const;

    const Parameters& parameters() const { return m_parameters; }

    // Pattern space is an abstract space that maps to the default user space by the transformation 'userSpaceTransform'
#if USE(SKIA)
    PlatformPatternPtr createPlatformPattern(const AffineTransform& userSpaceTransform, const SkSamplingOptions&) const;
#else
    PlatformPatternPtr createPlatformPattern(const AffineTransform& userSpaceTransform) const;
#endif

    void setPatternSpaceTransform(const AffineTransform&);

    const AffineTransform& patternSpaceTransform() const { return m_parameters.patternSpaceTransform; };
    bool repeatX() const { return m_parameters.repeatX; }
    bool repeatY() const { return m_parameters.repeatY; }

private:
    Pattern(SourceImage&&, const Parameters&);

    SourceImage m_tileImage;
    Parameters m_parameters;
};

} //namespace
