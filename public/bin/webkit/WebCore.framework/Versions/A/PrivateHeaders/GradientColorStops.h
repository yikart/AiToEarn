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

#include "GradientColorStop.h"
#include <algorithm>
#include <optional>
#include <wtf/Forward.h>
#include <wtf/Vector.h>

namespace WebCore {

class GradientColorStops {
public:
    using StopVector = Vector<GradientColorStop, 2>;

    struct Sorted {
        StopVector stops;
    };

    GradientColorStops()
        : m_isSorted { true }
    {
    }

    GradientColorStops(StopVector stops)
        : m_stops { WTFMove(stops) }
        , m_isSorted { false }
    {
    }

    GradientColorStops(Sorted sortedStops)
        : m_stops { WTFMove(sortedStops.stops) }
        , m_isSorted { true }
    {
        ASSERT(validateIsSorted());
    }

    void addColorStop(GradientColorStop stop)
    {
        if (!m_stops.isEmpty() && m_stops.last().offset > stop.offset)
            m_isSorted = false;
        m_stops.append(WTFMove(stop));
    }

    void sort()
    {
        if (m_isSorted)
            return;

        std::stable_sort(m_stops.begin(), m_stops.end(), [] (auto& a, auto& b) {
            return a.offset < b.offset;
        });
        m_isSorted = true;
    }

    const GradientColorStops& sorted() const
    {
        const_cast<GradientColorStops*>(this)->sort();
        return *this;
    }

    size_t size() const { return m_stops.size(); }
    bool isEmpty() const { return m_stops.isEmpty(); }

    StopVector::const_iterator begin() const { return m_stops.begin(); }
    StopVector::const_iterator end() const { return m_stops.end(); }

    template<typename MapFunction> GradientColorStops mapColors(MapFunction&& mapFunction) const
    {
        return {
            m_stops.map<StopVector>([&] (const GradientColorStop& stop) -> GradientColorStop {
                return { stop.offset, mapFunction(stop.color) };
            }),
            m_isSorted
        };
    }

    const StopVector& stops() const { return m_stops; }

private:
    GradientColorStops(StopVector stops, bool isSorted)
        : m_stops { WTFMove(stops) }
        , m_isSorted { isSorted }
    {
    }

#if ASSERT_ENABLED
    bool validateIsSorted() const
    {
        return std::is_sorted(m_stops.begin(), m_stops.end(), [] (auto& a, auto& b) {
            return a.offset < b.offset;
        });
    }
#endif

    StopVector m_stops;
    bool m_isSorted;
};

TextStream& operator<<(TextStream&, const GradientColorStops&);

} // namespace WebCore
