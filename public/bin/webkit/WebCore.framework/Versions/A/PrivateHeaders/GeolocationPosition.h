/*
 * Copyright (C) 2008 Apple Inc. All Rights Reserved.
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

#include "EpochTimeStamp.h"
#include "GeolocationCoordinates.h"
#include <wtf/RefCounted.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class GeolocationPosition : public RefCounted<GeolocationPosition> {
public:
    static Ref<GeolocationPosition> create(Ref<GeolocationCoordinates>&& coordinates, EpochTimeStamp timestamp)
    {
        return adoptRef(*new GeolocationPosition(WTFMove(coordinates), timestamp));
    }

    Ref<GeolocationPosition> isolatedCopy() const
    {
        return create(m_coordinates->isolatedCopy(), m_timestamp);
    }

    EpochTimeStamp timestamp() const { return m_timestamp; }
    const GeolocationCoordinates& coords() const { return m_coordinates.get(); }
    
private:
    GeolocationPosition(Ref<GeolocationCoordinates>&& coordinates, EpochTimeStamp timestamp)
        : m_coordinates(WTFMove(coordinates))
        , m_timestamp(timestamp)
    {
    }

    Ref<GeolocationCoordinates> m_coordinates;
    EpochTimeStamp m_timestamp;
};
    
} // namespace WebCore
