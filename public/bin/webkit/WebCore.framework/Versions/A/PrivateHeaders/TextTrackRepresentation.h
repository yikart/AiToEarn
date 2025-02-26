/*
 * Copyright (C) 2012 Apple Inc. All rights reserved.
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

#if ENABLE(VIDEO)

#include "PlatformLayer.h"
#include <wtf/Forward.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class HTMLMediaElement;
class NativeImage;
class IntRect;

class TextTrackRepresentationClient {
public:
    virtual ~TextTrackRepresentationClient() = default;

    virtual RefPtr<NativeImage> createTextTrackRepresentationImage() = 0;
    virtual void textTrackRepresentationBoundsChanged(const IntRect&) = 0;
};

class TextTrackRepresentation {
    WTF_MAKE_TZONE_ALLOCATED(TextTrackRepresentation);
public:
    static std::unique_ptr<TextTrackRepresentation> create(TextTrackRepresentationClient&, HTMLMediaElement&);

    virtual ~TextTrackRepresentation() = default;

    virtual void update() = 0;
    virtual PlatformLayer* platformLayer() = 0;
    virtual void setContentScale(float) = 0;
    virtual void setBounds(const IntRect&) = 0;
    virtual IntRect bounds() const = 0;
    virtual void setHidden(bool) const = 0;
};

}

#endif
