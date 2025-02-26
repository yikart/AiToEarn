/*
 * Copyright (C) 2016-2023 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#if ENABLE(MEDIA_STREAM)

#include "DoubleRange.h"
#include "LongRange.h"
#include <variant>
#include <wtf/Vector.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

struct MediaConstraints;

struct ConstrainBooleanParameters {
    std::optional<bool> exact;
    std::optional<bool> ideal;
};

struct ConstrainDOMStringParameters {
    std::optional<std::variant<String, Vector<String>>> exact;
    std::optional<std::variant<String, Vector<String>>> ideal;
};

struct ConstrainDoubleRange : DoubleRange {
    std::optional<double> exact;
    std::optional<double> ideal;
};

struct ConstrainLongRange : LongRange {
    std::optional<int> exact;
    std::optional<int> ideal;
};

using ConstrainBoolean = std::variant<bool, ConstrainBooleanParameters>;
using ConstrainDOMString = std::variant<String, Vector<String>, ConstrainDOMStringParameters>;
using ConstrainDouble = std::variant<double, ConstrainDoubleRange>;
using ConstrainLong = std::variant<int, ConstrainLongRange>;

struct MediaTrackConstraintSet {
    std::optional<ConstrainLong> width;
    std::optional<ConstrainLong> height;
    std::optional<ConstrainDouble> aspectRatio;
    std::optional<ConstrainDouble> frameRate;
    std::optional<ConstrainDOMString> facingMode;
    std::optional<ConstrainDouble> volume;
    std::optional<ConstrainLong> sampleRate;
    std::optional<ConstrainLong> sampleSize;
    std::optional<ConstrainBoolean> echoCancellation;
    std::optional<ConstrainDOMString> deviceId;
    std::optional<ConstrainDOMString> groupId;
    std::optional<ConstrainDOMString> displaySurface;
    std::optional<ConstrainBoolean> logicalSurface;

    std::optional<ConstrainDOMString> whiteBalanceMode;
    std::optional<ConstrainDouble> zoom;
    std::optional<ConstrainBoolean> torch;

    std::optional<ConstrainBoolean> backgroundBlur;
    std::optional<ConstrainBoolean> powerEfficient;
};

struct MediaTrackConstraints : MediaTrackConstraintSet {
    std::optional<Vector<MediaTrackConstraintSet>> advanced;
};

MediaConstraints createMediaConstraints(const MediaTrackConstraints&);

}

#endif
