/*
 * Copyright (C) 2014-2016 Igalia S.L.
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

namespace WebCore {

class GridSpan;
class RenderBox;
class RenderGrid;
class RenderStyle;

enum class GridTrackSizingDirection : uint8_t {
    ForColumns,
    ForRows
};

class NamedLineCollectionBase {
    WTF_MAKE_NONCOPYABLE(NamedLineCollectionBase);
public:
    NamedLineCollectionBase(const RenderGrid&, const String& name, GridPositionSide, bool nameIsAreaName);


    bool hasNamedLines() const;
    bool hasExplicitNamedLines() const;
    bool contains(unsigned line) const;
protected:

    void ensureInheritedNamedIndices();

    const Vector<unsigned>* m_namedLinesIndices { nullptr };
    const Vector<unsigned>* m_autoRepeatNamedLinesIndices { nullptr };
    const Vector<unsigned>* m_implicitNamedLinesIndices { nullptr };

    Vector<unsigned> m_inheritedNamedLinesIndices;

    unsigned m_insertionPoint { 0 };
    unsigned m_lastLine { 0 };
    unsigned m_autoRepeatTotalTracks { 0 };
    unsigned m_autoRepeatLines { 0 };
    unsigned m_autoRepeatTrackListLength { 0 };
    bool m_isSubgrid { false };
};

class NamedLineCollection : public NamedLineCollectionBase {
    WTF_MAKE_NONCOPYABLE(NamedLineCollection);
public:
    NamedLineCollection(const RenderGrid&, const String& name, GridPositionSide, bool nameIsAreaName = false);

    int firstPosition() const;

    unsigned lastLine() const;

private:
    int firstExplicitPosition() const;
};

// Class with all the code related to grid items positions resolution.
class GridPositionsResolver {
public:
    static GridPositionSide initialPositionSide(GridTrackSizingDirection);
    static GridPositionSide finalPositionSide(GridTrackSizingDirection);
    static unsigned spanSizeForAutoPlacedItem(const RenderBox&, GridTrackSizingDirection);
    static GridSpan resolveGridPositionsFromStyle(const RenderGrid& gridContainer, const RenderBox&, GridTrackSizingDirection);
    static unsigned explicitGridColumnCount(const RenderGrid&);
    static unsigned explicitGridRowCount(const RenderGrid&);
};

} // namespace WebCore
