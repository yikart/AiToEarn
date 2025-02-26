/*
 * Copyright (C) 2023 Apple Inc. All rights reserved.
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

#include "RenderingResourceIdentifier.h"
#include <variant>
#include <wtf/MachSendRight.h>
#include <wtf/Noncopyable.h>
#include <wtf/ObjectIdentifier.h>

namespace WebCore {
class IOSurface;

constexpr inline Seconds delegatedContentsFinishedTimeout = 5_s;

class WEBCORE_EXPORT PlatformCALayerDelegatedContentsFence : public ThreadSafeRefCounted<PlatformCALayerDelegatedContentsFence> {
    WTF_MAKE_NONCOPYABLE(PlatformCALayerDelegatedContentsFence);
public:
    PlatformCALayerDelegatedContentsFence();
    virtual ~PlatformCALayerDelegatedContentsFence();
    virtual bool waitFor(Seconds) = 0;
};

struct PlatformCALayerDelegatedContents {
    MachSendRight surface;
    RefPtr<PlatformCALayerDelegatedContentsFence> finishedFence;
    std::optional<RenderingResourceIdentifier> surfaceIdentifier;
};

struct PlatformCALayerInProcessDelegatedContents {
    const WebCore::IOSurface& surface; 
    RefPtr<PlatformCALayerDelegatedContentsFence> finishedFence;
};

}
