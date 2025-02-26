/*
 * Copyright (C) 2012-2020 Apple Inc. All rights reserved.
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

#if ENABLE(VIDEO)

#include "Color.h"
#include "InbandGenericCue.h"
#include "TrackPrivateBase.h"
#include <wtf/JSONValues.h>
#include <wtf/MediaTime.h>
#include <wtf/TZoneMallocInlines.h>

#if ENABLE(DATACUE_VALUE)
#include "SerializedPlatformDataCue.h"
#endif

namespace WebCore {

class InbandTextTrackPrivate;
class ISOWebVTTCue;

class InbandTextTrackPrivateClient : public TrackPrivateBaseClient {
    WTF_MAKE_TZONE_ALLOCATED_INLINE(InbandTextTrackPrivateClient);
public:
    virtual ~InbandTextTrackPrivateClient() = default;

    constexpr Type type() const final { return Type::Text; }

    virtual void addDataCue(const MediaTime& start, const MediaTime& end, std::span<const uint8_t>) = 0;

#if ENABLE(DATACUE_VALUE)
    virtual void addDataCue(const MediaTime& start, const MediaTime& end, Ref<SerializedPlatformDataCue>&&, const String&) = 0;
    virtual void updateDataCue(const MediaTime& start, const MediaTime& end, SerializedPlatformDataCue&) = 0;
    virtual void removeDataCue(const MediaTime& start, const MediaTime& end, SerializedPlatformDataCue&) = 0;
#endif

    virtual void addGenericCue(InbandGenericCue&) = 0;
    virtual void updateGenericCue(InbandGenericCue&) = 0;
    virtual void removeGenericCue(InbandGenericCue&) = 0;

    virtual void parseWebVTTFileHeader(String&&) { ASSERT_NOT_REACHED(); }
    virtual void parseWebVTTCueData(std::span<const uint8_t>) = 0;
    virtual void parseWebVTTCueData(ISOWebVTTCue&&) = 0;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::InbandTextTrackPrivateClient)
static bool isType(const WebCore::TrackPrivateBaseClient& track) { return track.type() == WebCore::TrackPrivateBaseClient::Type::Text; }
SPECIALIZE_TYPE_TRAITS_END()

#endif // ENABLE(VIDEO)
