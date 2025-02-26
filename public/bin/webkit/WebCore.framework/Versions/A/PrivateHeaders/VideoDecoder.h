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

#include "PlatformVideoColorSpace.h"
#include "ProcessIdentity.h"
#include <span>
#include <wtf/CompletionHandler.h>
#include <wtf/NativePromise.h>

namespace WebCore {

class VideoFrame;

class VideoDecoder : public ThreadSafeRefCounted<VideoDecoder> {
public:
    WEBCORE_EXPORT virtual ~VideoDecoder();

    enum class HardwareAcceleration : bool { No, Yes };
    enum class HardwareBuffer : bool { No, Yes };
    enum class TreatNoOutputAsError : bool { No, Yes };
    struct Config {
        std::span<const uint8_t> description;
        uint64_t width { 0 };
        uint64_t height { 0 };
        std::optional<PlatformVideoColorSpace> colorSpace;
        HardwareAcceleration decoding { HardwareAcceleration::No };
        HardwareBuffer pixelBuffer { HardwareBuffer::No };
        TreatNoOutputAsError noOutputAsError { TreatNoOutputAsError::Yes };
        ProcessIdentity resourceOwner { };
    };

    struct EncodedFrame {
        std::span<const uint8_t> data;
        bool isKeyFrame { false };
        int64_t timestamp { 0 };
        std::optional<uint64_t> duration;
    };
    struct DecodedFrame {
        Ref<VideoFrame> frame;
        int64_t timestamp { 0 };
        std::optional<uint64_t> duration;
    };

    static bool isVPXSupported();

    using OutputCallback = Function<void(Expected<DecodedFrame, String>&&)>;
    using CreateResult = Expected<Ref<VideoDecoder>, String>;
    using CreatePromise = NativePromise<Ref<VideoDecoder>, String>;
    using CreateCallback = Function<void(CreateResult&&)>;

    using CreatorFunction = void(*)(const String&, const Config&, CreateCallback&&, OutputCallback&&);
    WEBCORE_EXPORT static void setCreatorCallback(CreatorFunction&&);

    static Ref<CreatePromise> create(const String&, const Config&, OutputCallback&&);
    WEBCORE_EXPORT static void createLocalDecoder(const String&, const Config&, CreateCallback&&, OutputCallback&&);

    using DecodePromise = NativePromise<void, String>;
    virtual Ref<DecodePromise> decode(EncodedFrame&&) = 0;

    virtual Ref<GenericPromise> flush() = 0;
    virtual void reset() = 0;
    virtual void close() = 0;

    static String fourCCToCodecString(uint32_t fourCC);

    static CreatorFunction s_customCreator;
protected:
    WEBCORE_EXPORT VideoDecoder();

};

}
