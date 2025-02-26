/*
 * Copyright (C) 2009, 2014-2019 Apple Inc. All rights reserved.
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

#if ENABLE(WEBGL)

#include "GraphicsContextGL.h"
#include <wtf/HashCountedSet.h>
#include <wtf/HashMap.h>
#include <wtf/HashTraits.h>

namespace WebCore {

struct GraphicsContextGLState {
    GCGLuint boundReadFBO { 0 };
    GCGLuint boundDrawFBO { 0 };
    GCGLenum activeTextureUnit { GraphicsContextGL::TEXTURE0 };

    using BoundTextureMap = UncheckedKeyHashMap<GCGLenum,
        std::pair<GCGLuint, GCGLenum>,
        IntHash<GCGLenum>,
        WTF::UnsignedWithZeroKeyHashTraits<GCGLuint>,
        PairHashTraits<WTF::UnsignedWithZeroKeyHashTraits<GCGLuint>, WTF::UnsignedWithZeroKeyHashTraits<GCGLuint>>
    >;
    BoundTextureMap boundTextureMap;
    GCGLuint currentBoundTexture() const { return boundTexture(activeTextureUnit); }
    GCGLuint boundTexture(GCGLenum textureUnit) const
    {
        auto iterator = boundTextureMap.find(textureUnit);
        if (iterator != boundTextureMap.end())
            return iterator->value.first;
        return 0;
    }

    GCGLuint currentBoundTarget() const { return boundTarget(activeTextureUnit); }
    GCGLenum boundTarget(GCGLenum textureUnit) const
    {
        auto iterator = boundTextureMap.find(textureUnit);
        if (iterator != boundTextureMap.end())
            return iterator->value.second;
        return 0;
    }

    void setBoundTexture(GCGLenum textureUnit, GCGLuint texture, GCGLenum target)
    {
        boundTextureMap.set(textureUnit, std::make_pair(texture, target));
    }
};

}

#endif
