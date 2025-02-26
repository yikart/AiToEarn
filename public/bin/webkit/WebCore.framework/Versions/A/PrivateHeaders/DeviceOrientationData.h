/*
 * Copyright (C) 2010 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *  * Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include <optional>
#include <wtf/Ref.h>
#include <wtf/RefCounted.h>

namespace WebCore {

class DeviceOrientationData : public RefCounted<DeviceOrientationData> {
public:
    static Ref<DeviceOrientationData> create()
    {
        return adoptRef(*new DeviceOrientationData);
    }

#if PLATFORM(IOS_FAMILY)
    WEBCORE_EXPORT static Ref<DeviceOrientationData> create(std::optional<double> alpha, std::optional<double> beta, std::optional<double> gamma, std::optional<double> compassHeading, std::optional<double> compassAccuracy);
#else
    WEBCORE_EXPORT static Ref<DeviceOrientationData> create(std::optional<double> alpha, std::optional<double> beta, std::optional<double> gamma, std::optional<bool> absolute);
#endif

    std::optional<double> alpha() const { return m_alpha; }
    std::optional<double> beta() const { return m_beta; }
    std::optional<double> gamma() const { return m_gamma; }
#if PLATFORM(IOS_FAMILY)
    std::optional<double> compassHeading() const { return m_compassHeading; }
    std::optional<double> compassAccuracy() const { return m_compassAccuracy; }
#else
    std::optional<bool> absolute() const { return m_absolute; }
#endif

private:
    DeviceOrientationData() = default;
#if PLATFORM(IOS_FAMILY)
    DeviceOrientationData(std::optional<double> alpha, std::optional<double> beta, std::optional<double> gamma, std::optional<double> compassHeading, std::optional<double> compassAccuracy);
#else
    DeviceOrientationData(std::optional<double> alpha, std::optional<double> beta, std::optional<double> gamma, std::optional<bool> absolute);
#endif

    std::optional<double> m_alpha;
    std::optional<double> m_beta;
    std::optional<double> m_gamma;
#if PLATFORM(IOS_FAMILY)
    std::optional<double> m_compassHeading;
    std::optional<double> m_compassAccuracy;
#else
    std::optional<bool> m_absolute;
#endif
};

} // namespace WebCore
