/*
 * Copyright (C) 2017-2024 Apple Inc. All rights reserved.
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

#include "BoxSides.h"
#include "WritingMode.h"
#include <array>
#include <wtf/OptionSet.h>
#include <wtf/text/TextStream.h>

namespace WebCore {

template<typename T> class RectEdges {
public:
    RectEdges() requires (std::is_default_constructible_v<T>)
        : m_sides { }
    {
    }

    RectEdges(const RectEdges&) = default;
    RectEdges& operator=(const RectEdges&) = default;

    template<typename U>
    RectEdges(U&& top, U&& right, U&& bottom, U&& left)
        : m_sides({ { std::forward<T>(top), std::forward<T>(right), std::forward<T>(bottom), std::forward<T>(left) } })
    {
    }

    template<typename U>
    RectEdges(const RectEdges<U>& other)
        : RectEdges(other.top(), other.right(), other.bottom(), other.left())
    {
    }

    T& at(BoxSide side) { return m_sides[static_cast<size_t>(side)]; }
    T& operator[](BoxSide side) { return m_sides[static_cast<size_t>(side)]; }
    T& top() { return at(BoxSide::Top); }
    T& right() { return at(BoxSide::Right); }
    T& bottom() { return at(BoxSide::Bottom); }
    T& left() { return at(BoxSide::Left); }

    const T& at(BoxSide side) const { return m_sides[static_cast<size_t>(side)]; }
    const T& operator[](BoxSide side) const { return m_sides[static_cast<size_t>(side)]; }
    const T& top() const { return at(BoxSide::Top); }
    const T& right() const { return at(BoxSide::Right); }
    const T& bottom() const { return at(BoxSide::Bottom); }
    const T& left() const { return at(BoxSide::Left); }

    void setAt(BoxSide side, const T& v) { at(side) = v; }
    void setTop(const T& top) { setAt(BoxSide::Top, top); }
    void setRight(const T& right) { setAt(BoxSide::Right, right); }
    void setBottom(const T& bottom) { setAt(BoxSide::Bottom, bottom); }
    void setLeft(const T& left) { setAt(BoxSide::Left, left); }

    RectEdges<T> xFlippedCopy() const
    {
        RectEdges<T> copy { *this };
        copy.left() = right();
        copy.right() = left();
        return copy;
    }
    RectEdges<T> yFlippedCopy() const
    {
        RectEdges<T> copy { *this };
        copy.top() = bottom();
        copy.bottom() = top();
        return copy;
    }

    T& before(WritingMode writingMode) { return at(mapSideLogicalToPhysical(writingMode, LogicalBoxSide::BlockStart)); }
    T& after(WritingMode writingMode) { return at(mapSideLogicalToPhysical(writingMode, LogicalBoxSide::BlockEnd)); }
    T& start(WritingMode writingMode) { return at(mapSideLogicalToPhysical(writingMode, LogicalBoxSide::InlineStart)); }
    T& end(WritingMode writingMode) { return at(mapSideLogicalToPhysical(writingMode, LogicalBoxSide::InlineEnd)); }
    T& logicalLeft(WritingMode writingMode) { return at(mapSideLogicalToPhysical(writingMode, LogicalBoxSide::LogicalLeft)); }
    T& logicalRight(WritingMode writingMode) { return at(mapSideLogicalToPhysical(writingMode, LogicalBoxSide::LogicalRight)); }

    const T& before(WritingMode writingMode) const { return at(mapSideLogicalToPhysical(writingMode, LogicalBoxSide::BlockStart)); }
    const T& after(WritingMode writingMode) const { return at(mapSideLogicalToPhysical(writingMode, LogicalBoxSide::BlockEnd)); }
    const T& start(WritingMode writingMode) const { return at(mapSideLogicalToPhysical(writingMode, LogicalBoxSide::InlineStart)); }
    const T& end(WritingMode writingMode) const { return at(mapSideLogicalToPhysical(writingMode, LogicalBoxSide::InlineEnd)); }
    const T& logicalLeft(WritingMode writingMode) const { return at(mapSideLogicalToPhysical(writingMode, LogicalBoxSide::LogicalLeft)); }
    const T& logicalRight(WritingMode writingMode) const { return at(mapSideLogicalToPhysical(writingMode, LogicalBoxSide::LogicalRight)); }

    void setBefore(const T& before, WritingMode writingMode) { this->before(writingMode) = before; }
    void setAfter(const T& after, WritingMode writingMode) { this->after(writingMode) = after; }
    void setStart(const T& start, WritingMode writingMode) { this->start(writingMode) = start; }
    void setEnd(const T& end, WritingMode writingMode) { this->end(writingMode) = end; }
    void setLogicalLeft(const T& logicalLeft, WritingMode writingMode) { this->logicalLeft(writingMode) = logicalLeft; }
    void setLogicalRight(const T& logicalRight, WritingMode writingMode) { this->logicalRight(writingMode) = logicalRight; }

    RectEdges<T> blockFlippedCopy(WritingMode writingMode) const
    {
        if (writingMode.isHorizontal())
            return yFlippedCopy();
        return xFlippedCopy();
    }
    RectEdges<T> inlineFlippedCopy(WritingMode writingMode) const
    {
        if (writingMode.isHorizontal())
            return xFlippedCopy();
        return yFlippedCopy();
    }

    bool isZero() const
    {
        return !top() && !right() && !bottom() && !left();
    }

    bool operator==(const RectEdges<T>&) const = default;

private:
    std::array<T, 4> m_sides;
};

template<typename T>
constexpr RectEdges<T> operator+(const RectEdges<T>& a, const RectEdges<T>& b)
{
    return {
        a.top() + b.top(),
        a.right() + b.right(),
        a.bottom() + b.bottom(),
        a.left() + b.left()
    };
}

template<typename T>
inline RectEdges<T>& operator+=(RectEdges<T>& a, const RectEdges<T>& b)
{
    a = a + b;
    return a;
}

template<typename T>
TextStream& operator<<(TextStream& ts, const RectEdges<T>& edges)
{
    ts << "[top " << edges.top() << " right " << edges.right() << " bottom " << edges.bottom() << " left " << edges.left() << "]";
    return ts;
}

}
