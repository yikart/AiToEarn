/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "FloatPoint.h"
#include "FloatQuad.h"
#include "FloatRect.h"
#include <optional>

namespace WebCore {

class FloatLine {
public:
    FloatLine() = default;
    FloatLine(const FloatPoint& start, const FloatPoint& end)
        : m_start(start)
        , m_end(end)
        , m_length(sqrtf(powf(start.x() - end.x(), 2) + powf(start.y() - end.y(), 2)))
    {
    }
    
    const FloatPoint& start() const { return m_start; }
    const FloatPoint& end() const { return m_end; }
    
    float length() const { return m_length; }

    WEBCORE_EXPORT const FloatPoint pointAtAbsoluteDistance(float) const;
    const FloatPoint pointAtRelativeDistance(float) const;
    const FloatLine extendedToBounds(const FloatRect&) const;
    const std::optional<FloatPoint> intersectionWith(const FloatLine&) const;
    
private:
    FloatPoint m_start { 0, 0 };
    FloatPoint m_end { 0, 0 };
    float m_length { 0 };
};

}
