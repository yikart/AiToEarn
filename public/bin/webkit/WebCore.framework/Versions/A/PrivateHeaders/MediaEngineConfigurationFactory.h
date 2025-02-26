/*
 * Copyright (C) 2018 Igalia S.L.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above
 *    copyright notice, this list of conditions and the following
 *    disclaimer in the documentation and/or other materials provided
 *    with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include <wtf/Function.h>

namespace WebCore {

struct MediaCapabilitiesDecodingInfo;
struct MediaCapabilitiesEncodingInfo;
struct MediaDecodingConfiguration;
struct MediaEncodingConfiguration;

class MediaEngineConfigurationFactory {
public:
    using DecodingConfigurationCallback = Function<void(MediaCapabilitiesDecodingInfo&&)>;
    using EncodingConfigurationCallback = Function<void(MediaCapabilitiesEncodingInfo&&)>;

    static bool hasDecodingConfigurationFactory();
    static bool hasEncodingConfigurationFactory();

    WEBCORE_EXPORT static void createDecodingConfiguration(MediaDecodingConfiguration&&, DecodingConfigurationCallback&&);
    WEBCORE_EXPORT static void createEncodingConfiguration(MediaEncodingConfiguration&&, EncodingConfigurationCallback&&);
    
    using CreateDecodingConfiguration = Function<void(MediaDecodingConfiguration&&, DecodingConfigurationCallback&&)>;
    using CreateEncodingConfiguration = Function<void(MediaEncodingConfiguration&&, EncodingConfigurationCallback&&)>;

    struct MediaEngineFactory {
        CreateDecodingConfiguration createDecodingConfiguration;
        CreateEncodingConfiguration createEncodingConfiguration;
    };
    
    WEBCORE_EXPORT static void clearFactories();
    WEBCORE_EXPORT static void resetFactories();
    WEBCORE_EXPORT static void installFactory(MediaEngineFactory&&);
    
    WEBCORE_EXPORT static void enableMock();
    WEBCORE_EXPORT static void disableMock();
};

} // namespace WebCore
