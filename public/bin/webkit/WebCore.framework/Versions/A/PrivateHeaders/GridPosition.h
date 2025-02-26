/*
 * Copyright (C) 2012 Google Inc. All rights reserved.
 * Copyright (C) 2013-2017 Igalia S.L.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include <wtf/text/WTFString.h>

namespace WebCore {

enum class GridPositionType : uint8_t {
    AutoPosition,
    ExplicitPosition, // [ <integer> || <string> ]
    SpanPosition, // span && [ <integer> || <string> ]
    NamedGridAreaPosition // <ident>
};

enum class GridPositionSide : uint8_t {
    ColumnStartSide,
    ColumnEndSide,
    RowStartSide,
    RowEndSide
};

class GridPosition {
public:
    bool isPositive() const { return integerPosition() > 0; }

    GridPositionType type() const { return m_type; }
    bool isAuto() const { return m_type == GridPositionType::AutoPosition; }
    bool isSpan() const { return m_type == GridPositionType::SpanPosition; }
    bool isNamedGridArea() const { return m_type == GridPositionType::NamedGridAreaPosition; }

    WEBCORE_EXPORT void setExplicitPosition(int position, const String& namedGridLine);
    void setAutoPosition();
    WEBCORE_EXPORT void setSpanPosition(int position, const String& namedGridLine);
    void setNamedGridArea(const String&);

    WEBCORE_EXPORT int integerPosition() const;
    String namedGridLine() const;
    WEBCORE_EXPORT int spanPosition() const;

    friend bool operator==(const GridPosition&, const GridPosition&) = default;

    bool shouldBeResolvedAgainstOppositePosition() const { return isAuto() || isSpan(); }

    // Note that grid line 1 is internally represented by the index 0, that's why the max value for
    // a position is kGridMaxTracks instead of kGridMaxTracks + 1.
    static int max();
    static int min();

    WEBCORE_EXPORT static void setMaxPositionForTesting(unsigned);

private:
    static std::optional<int> gMaxPositionForTesting;

    void setIntegerPosition(int integerPosition) { m_integerPosition = clampTo(integerPosition, min(), max()); }

    GridPositionType m_type { GridPositionType::AutoPosition };
    int m_integerPosition { 0 };
    String m_namedGridLine;
};

WTF::TextStream& operator<<(WTF::TextStream&, const GridPosition&);

} // namespace WebCore
