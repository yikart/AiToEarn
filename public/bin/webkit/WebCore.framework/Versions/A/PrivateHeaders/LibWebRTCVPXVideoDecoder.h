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

#if USE(LIBWEBRTC)

#include "VideoDecoder.h"
#include <wtf/TZoneMalloc.h>
#include <wtf/UniqueRef.h>

namespace WebCore {

class LibWebRTCVPXInternalVideoDecoder;

class LibWebRTCVPXVideoDecoder : public VideoDecoder {
    WTF_MAKE_TZONE_ALLOCATED(LibWebRTCVPXVideoDecoder);
public:
    enum class Type {
        VP8,
        VP9,
        VP9_P2,
#if ENABLE(AV1)
        AV1
#endif
    };
    static void create(Type, const Config&, CreateCallback&&, OutputCallback&&);

    ~LibWebRTCVPXVideoDecoder();

private:
    LibWebRTCVPXVideoDecoder(Type, const Config&, OutputCallback&&);

    Ref<DecodePromise> decode(EncodedFrame&&) final;
    Ref<GenericPromise> flush() final;
    void reset() final;
    void close() final;

    Ref<LibWebRTCVPXInternalVideoDecoder> m_internalDecoder;
};

}

#endif // USE(LIBWEBRTC)
