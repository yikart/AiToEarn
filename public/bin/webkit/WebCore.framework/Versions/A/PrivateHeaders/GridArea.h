/*
 * Copyright (C) 2013 Google Inc. All rights reserved.
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

#include "GridPosition.h"
#include <wtf/HashMap.h>
#include <wtf/TZoneMallocInlines.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

// A span in a single direction (either rows or columns). Note that |startLine|
// and |endLine| are grid lines' indexes.
// Despite line numbers in the spec start in "1", the indexes here start in "0".
class GridSpan {
public:

    static GridSpan untranslatedDefiniteGridSpan(int startLine, int endLine)
    {
        return GridSpan(startLine, endLine, UntranslatedDefinite);
    }

    static GridSpan translatedDefiniteGridSpan(unsigned startLine, unsigned endLine)
    {
        return GridSpan(startLine, endLine, TranslatedDefinite);
    }

    static GridSpan indefiniteGridSpan()
    {
        return GridSpan(0, 1, Indefinite);
    }

    static GridSpan masonryAxisTranslatedDefiniteGridSpan()
    {
        return GridSpan(0, 1, TranslatedDefinite);
    }

    friend bool operator==(const GridSpan&, const GridSpan&) = default;

    unsigned integerSpan() const
    {
        ASSERT(!isIndefinite());
        return m_endLine - m_startLine;
    }

    int untranslatedStartLine() const
    {
        ASSERT(m_type == UntranslatedDefinite);
        return m_startLine;
    }

    int untranslatedEndLine() const
    {
        ASSERT(m_type == UntranslatedDefinite);
        return m_endLine;
    }

    unsigned startLine() const
    {
        ASSERT(isTranslatedDefinite());
        ASSERT(m_endLine >= 0);
        return m_startLine;
    }

    unsigned endLine() const
    {
        ASSERT(isTranslatedDefinite());
        ASSERT(m_endLine > 0);
        return m_endLine;
    }

    struct GridSpanIterator {
        GridSpanIterator(unsigned value)
            : value(value)
        {
        }

        operator unsigned&() { return value; }
        unsigned operator*() const { return value; }

        unsigned value;
    };

    GridSpanIterator begin() const
    {
        ASSERT(isTranslatedDefinite());
        return m_startLine;
    }

    GridSpanIterator end() const
    {
        ASSERT(isTranslatedDefinite());
        return m_endLine;
    }

    bool isTranslatedDefinite() const
    {
        return m_type == TranslatedDefinite;
    }

    bool isIndefinite() const
    {
        return m_type == Indefinite;
    }

    void translate(unsigned offset)
    {
        ASSERT(m_type == UntranslatedDefinite);

        m_type = TranslatedDefinite;
        m_startLine += offset;
        m_endLine += offset;

        ASSERT(m_startLine >= 0);
        ASSERT(m_endLine > 0);
    }

    // Moves this span to be in the same coordinate space as |parent|.
    // If reverse is specified, then swaps the direction to handle RTL/LTR changes.
    void translateTo(const GridSpan& parent, bool reverse)
    {
        ASSERT(m_type == TranslatedDefinite);
        ASSERT(parent.m_type == TranslatedDefinite);
        if (reverse) {
            int start = m_startLine;
            m_startLine = parent.endLine() - m_endLine;
            m_endLine = parent.endLine() - start;
        } else {
            m_startLine += parent.m_startLine;
            m_endLine += parent.m_startLine;
        }
    }

    void clamp(int max)
    {
        ASSERT(m_type != Indefinite);
        m_startLine = std::max(m_startLine, 0);
        m_endLine = std::max(std::min(m_endLine, max), 1);
        if (m_startLine >= m_endLine)
            m_startLine = m_endLine - 1;
    }

    bool clamp(int min, int max)
    {
        ASSERT(min < max);
        ASSERT(m_startLine < m_endLine);
        ASSERT(m_type != Indefinite);
        if (min >= m_endLine || max <= m_startLine)
            return false;
        m_startLine = std::max(m_startLine, min);
        m_endLine = std::min(m_endLine, max);
        ASSERT(m_startLine < m_endLine);
        return true;
    }

private:

    enum GridSpanType {UntranslatedDefinite, TranslatedDefinite, Indefinite};

    GridSpan(int startLine, int endLine, GridSpanType type)
        : m_type(type)
    {
#if ASSERT_ENABLED
        ASSERT(startLine < endLine);
        if (type == TranslatedDefinite) {
            ASSERT(startLine >= 0);
            ASSERT(endLine > 0);
        }
#endif

        m_startLine = std::max(GridPosition::min(), std::min(startLine, GridPosition::max() - 1));
        m_endLine = std::max(GridPosition::min() + 1, std::min(endLine, GridPosition::max()));
    }

    int m_startLine;
    int m_endLine;
    GridSpanType m_type;
};

// This represents a grid area that spans in both rows' and columns' direction.
class GridArea {
    WTF_MAKE_TZONE_ALLOCATED_INLINE(GridArea);
public:
    // UncheckedKeyHashMap requires a default constuctor.
    GridArea()
        : columns(GridSpan::indefiniteGridSpan())
        , rows(GridSpan::indefiniteGridSpan())
    {
    }

    GridArea(const GridSpan& r, const GridSpan& c)
        : columns(c)
        , rows(r)
    {
    }

    bool operator==(const GridArea& o) const
    {
        return columns == o.columns && rows == o.rows;
    }

    GridSpan columns;
    GridSpan rows;
};

struct NamedGridAreaMap {
    UncheckedKeyHashMap<String, GridArea> map;

    friend bool operator==(const NamedGridAreaMap&, const NamedGridAreaMap&) = default;
};

} // namespace WebCore
