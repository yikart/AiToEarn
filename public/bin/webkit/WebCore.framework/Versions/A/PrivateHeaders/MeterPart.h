/*
 * Copyright (C) 2022 Apple Inc. All Rights Reserved.
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

#include "ControlPart.h"

namespace WebCore {

class MeterPart : public ControlPart {
public:
    enum class GaugeRegion : uint8_t {
        Optimum,
        Suboptimal,
        EvenLessGood
    };

    static Ref<MeterPart> create();
    WEBCORE_EXPORT static Ref<MeterPart> create(GaugeRegion, double value, double minimum, double maximum);

    GaugeRegion gaugeRegion() const { return m_gaugeRegion; }
    void setGaugeRegion(GaugeRegion gaugeRegion) { m_gaugeRegion = gaugeRegion; }

    double value() const { return m_value; }
    void setValue(double value) { m_value = value; }

    double minimum() const { return m_minimum; }
    void setMinimum(double minimum) { m_minimum = minimum; }

    double maximum() const { return m_maximum; }
    void setMaximum(double maximum) { m_maximum = maximum; }

private:
    MeterPart(GaugeRegion, double value, double minimum, double maximum);

    std::unique_ptr<PlatformControl> createPlatformControl() override;

    GaugeRegion m_gaugeRegion;
    double m_value;
    double m_minimum;
    double m_maximum;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_CONTROL_PART(Meter)
