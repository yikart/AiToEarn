/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
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

#ifdef __cplusplus

#include <WebKit/FullscreenTouchSecheuristicParameters.h>

namespace WebKit {

class FullscreenTouchSecheuristic {
public:
    WK_EXPORT double scoreOfNextTouch(CGPoint location);
    WK_EXPORT double scoreOfNextTouch(CGPoint location, const Seconds& deltaTime);
    WK_EXPORT void reset();

    void setParameters(const FullscreenTouchSecheuristicParameters& parameters) { m_parameters = parameters; }
    double requiredScore() const { return m_parameters.requiredScore; }

    void setRampUpSpeed(Seconds speed) { m_parameters.rampUpSpeed = speed; }
    void setRampDownSpeed(Seconds speed) { m_parameters.rampDownSpeed = speed; }
    void setXWeight(double weight) { m_parameters.xWeight = weight; }
    void setYWeight(double weight) { m_parameters.yWeight = weight; }
    void setSize(CGSize size) { m_size = size; }
    void setGamma(double gamma) { m_parameters.gamma = gamma; }
    void setGammaCutoff(double cutoff) { m_parameters.gammaCutoff = cutoff; }

private:
    WK_EXPORT double distanceScore(const CGPoint& nextLocation, const CGPoint& lastLocation, const Seconds& deltaTime);
    WK_EXPORT double attenuationFactor(Seconds delta);

    double m_weight { 0.1 };
    FullscreenTouchSecheuristicParameters m_parameters;
    CGSize m_size { };
    Seconds m_lastTouchTime { 0 };
    CGPoint m_lastTouchLocation { -1, -1 };
    double m_lastScore { 0 };
};

}

#endif
