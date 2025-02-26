/*
 * Copyright (C) 2023 ChangSeok Oh <changseok@webkit.org>
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

#include "FontMetrics.h"
#include <variant>
#include <wtf/Markable.h>
#include <wtf/text/TextStream.h>

namespace WebCore {

struct FontSizeAdjust {
    friend bool operator==(const FontSizeAdjust&, const FontSizeAdjust&) = default;

    enum class ValueType : bool { Number, FromFont };
    enum class Metric : uint8_t {
        ExHeight,
        CapHeight,
        ChWidth,
        IcWidth,
        IcHeight
    };

    std::optional<float> resolve(float computedSize, const FontMetrics& fontMetrics) const
    {
        std::optional<float> metricValue;
        switch (metric) {
        case FontSizeAdjust::Metric::CapHeight:
            metricValue = fontMetrics.capHeight();
            break;
        case FontSizeAdjust::Metric::ChWidth:
            metricValue = fontMetrics.zeroWidth();
            break;
        // FIXME: Are ic-height and ic-width the same? Gecko treats them the same.
        case FontSizeAdjust::Metric::IcWidth:
        case FontSizeAdjust::Metric::IcHeight:
            metricValue = fontMetrics.ideogramWidth();
            break;
        case FontSizeAdjust::Metric::ExHeight:
        default:
            metricValue = fontMetrics.xHeight();
        }

        return metricValue.has_value() && computedSize
            ? std::make_optional(*metricValue / computedSize)
            : std::nullopt;
    }

    bool isNone() const { return !value && type != ValueType::FromFont; }
    bool isFromFont() const { return type == ValueType::FromFont; }
    bool shouldResolveFromFont() const { return isFromFont() && !value; }

    Metric metric { Metric::ExHeight };
    ValueType type { ValueType::Number };
    Markable<float, WTF::FloatMarkableTraits> value { };
};

inline void add(Hasher& hasher, const FontSizeAdjust& fontSizeAdjust)
{
    add(hasher, fontSizeAdjust.metric, fontSizeAdjust.type, fontSizeAdjust.value.unsafeValue());
}

inline TextStream& operator<<(TextStream& ts, const FontSizeAdjust& fontSizeAdjust)
{
    switch (fontSizeAdjust.metric) {
    case FontSizeAdjust::Metric::CapHeight:
        ts << "cap-height";
        break;
    case FontSizeAdjust::Metric::ChWidth:
        ts << "ch-width";
        break;
    case FontSizeAdjust::Metric::IcWidth:
        ts << "ic-width";
        break;
    case FontSizeAdjust::Metric::IcHeight:
        ts << "ic-height";
        break;
    case FontSizeAdjust::Metric::ExHeight:
    default:
        if (fontSizeAdjust.isFromFont())
            return ts << "from-font";
        return ts << *fontSizeAdjust.value;
    }

    if (fontSizeAdjust.isFromFont())
        return ts << " " << "from-font";
    return ts << " " << *fontSizeAdjust.value;
}

}
