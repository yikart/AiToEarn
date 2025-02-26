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

#if ENABLE(VIDEO)

#include "VideoEncoderActiveConfiguration.h"
#include "VideoEncoderScalabilityMode.h"
#include "VideoFrame.h"
#include <span>
#include <wtf/CompletionHandler.h>
#include <wtf/NativePromise.h>

namespace WebCore {

class VideoEncoder : public ThreadSafeRefCounted<VideoEncoder> {
public:
    virtual ~VideoEncoder() = default;

    using ScalabilityMode = VideoEncoderScalabilityMode;

    struct Config {
        uint64_t width { 0 };
        uint64_t height { 0 };
        bool useAnnexB { false };
        uint64_t bitRate { 0 };
        double frameRate { 0 };
        bool isRealtime { true };
        ScalabilityMode scalabilityMode { ScalabilityMode::L1T1 };
    };
    using ActiveConfiguration = VideoEncoderActiveConfiguration;
    struct EncodedFrame {
        Vector<uint8_t> data;
        bool isKeyFrame { false };
        int64_t timestamp { 0 };
        std::optional<uint64_t> duration;
        std::optional<unsigned> temporalIndex;
    };
    struct RawFrame {
        Ref<VideoFrame> frame;
        int64_t timestamp { 0 };
        std::optional<uint64_t> duration;
    };
    using CreateResult = Expected<Ref<VideoEncoder>, String>;
    using CreatePromise = NativePromise<Ref<VideoEncoder>, String>;

    using DescriptionCallback = Function<void(ActiveConfiguration&&)>;
    using OutputCallback = Function<void(EncodedFrame&&)>;
    using CreateCallback = Function<void(CreateResult&&)>;

    using CreatorFunction = void(*)(const String&, const Config&, CreateCallback&&, DescriptionCallback&&, OutputCallback&&);
    WEBCORE_EXPORT static void setCreatorCallback(CreatorFunction&&);

    static Ref<CreatePromise> create(const String&, const Config&, DescriptionCallback&&, OutputCallback&&);
    WEBCORE_EXPORT static void createLocalEncoder(const String&, const Config&, CreateCallback&&, DescriptionCallback&&, OutputCallback&&);

    using EncodePromise = NativePromise<void, String>;
    virtual Ref<EncodePromise> encode(RawFrame&&, bool shouldGenerateKeyFrame) = 0;

    virtual Ref<GenericPromise> setRates(uint64_t /* bitRate */, double /* frameRate */) = 0;
    virtual Ref<GenericPromise> flush() = 0;
    virtual void reset() = 0;
    virtual void close() = 0;

    static CreatorFunction s_customCreator;
};

}

#endif // ENABLE(VIDEO)
