/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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

#include "CSSNumericValue.h"
#include <wtf/Seconds.h>

namespace WebCore {

class WebAnimationTime {
public:
    WebAnimationTime() = default;
    WEBCORE_EXPORT WebAnimationTime(std::optional<Seconds>, std::optional<double>);

    WEBCORE_EXPORT WebAnimationTime(const Seconds&);
    WebAnimationTime(const CSSNumberish&);

    static WebAnimationTime fromMilliseconds(double);
    static WebAnimationTime fromPercentage(double);

    WEBCORE_EXPORT std::optional<Seconds> time() const;
    WEBCORE_EXPORT std::optional<double> percentage() const;

    bool isValid() const;
    bool isInfinity() const;
    bool isZero() const;
    bool isNaN() const;

    WebAnimationTime matchingZero() const;
    WebAnimationTime matchingEpsilon() const;
    WebAnimationTime matchingInfinity() const;

    bool approximatelyEqualTo(const WebAnimationTime&) const;
    bool approximatelyLessThan(const WebAnimationTime&) const;
    bool approximatelyGreaterThan(const WebAnimationTime&) const;

    WebAnimationTime operator+(const WebAnimationTime&) const;
    WebAnimationTime operator-(const WebAnimationTime&) const;
    double operator/(const WebAnimationTime&) const;
    WebAnimationTime& operator+=(const WebAnimationTime&);
    WebAnimationTime& operator-=(const WebAnimationTime&);
    bool operator<(const WebAnimationTime&) const;
    bool operator<=(const WebAnimationTime&) const;
    bool operator>(const WebAnimationTime&) const;
    bool operator>=(const WebAnimationTime&) const;
    bool operator==(const WebAnimationTime&) const;

    WebAnimationTime operator+(const Seconds&) const;
    WebAnimationTime operator-(const Seconds&) const;
    bool operator<(const Seconds&) const;
    bool operator<=(const Seconds&) const;
    bool operator>(const Seconds&) const;
    bool operator>=(const Seconds&) const;
    bool operator==(const Seconds&) const;

    WebAnimationTime operator*(double) const;
    WebAnimationTime operator/(double) const;

    WEBCORE_EXPORT operator Seconds() const;
    operator CSSNumberish() const;

    void dump(TextStream&) const;

private:
    enum class Type : uint8_t { Unknown, Time, Percentage };

    WebAnimationTime(Type, double);

    Type m_type { Type::Unknown };
    double m_value { 0 };
};

TextStream& operator<<(TextStream&, const WebAnimationTime&);

} // namespace WebCore
