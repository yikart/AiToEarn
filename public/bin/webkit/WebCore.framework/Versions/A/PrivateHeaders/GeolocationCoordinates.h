/*
 * Copyright (C) 2009-2017 Apple Inc. All Rights Reserved.
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

#include "GeolocationPositionData.h"
#include <wtf/Ref.h>
#include <wtf/RefCounted.h>

namespace WebCore {

class GeolocationCoordinates : public RefCounted<GeolocationCoordinates> {
public:
    static Ref<GeolocationCoordinates> create(GeolocationPositionData&& position)
    {
        return adoptRef(*new GeolocationCoordinates(WTFMove(position)));
    }

    Ref<GeolocationCoordinates> isolatedCopy() const
    {
        return GeolocationCoordinates::create(GeolocationPositionData(m_position));
    }

    double latitude() const { return m_position.latitude; }
    double longitude() const { return m_position.longitude; }
    std::optional<double> altitude() const { return m_position.altitude; }
    double accuracy() const { return m_position.accuracy; }
    std::optional<double> altitudeAccuracy() const { return m_position.altitudeAccuracy; }
    std::optional<double> heading() const { return m_position.heading; }
    std::optional<double> speed() const { return m_position.speed; }
    std::optional<double> floorLevel() const { return m_position.floorLevel; }
    
private:
    explicit GeolocationCoordinates(GeolocationPositionData&&);

    GeolocationPositionData m_position;
};
    
} // namespace WebCore
