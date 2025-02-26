/*
 * Copyright (C) 2013 Adobe Systems Incorporated. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions of source code must retain the above
 *    copyright notice, this list of conditions and the following
 *    disclaimer.
 * 2. Redistributions in binary form must reproduce the above
 *    copyright notice, this list of conditions and the following
 *    disclaimer in the documentation and/or other materials
 *    provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
 * FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 * COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
 * OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "LayoutUnit.h"

namespace WebCore {

class FloatingObject;
class RenderBlockFlow;
class RenderObject;
class RenderStyle;

struct LineSegment;

class LineWidth {
public:
    LineWidth(RenderBlockFlow&, bool isFirstLine);

    bool fitsOnLine(bool ignoringTrailingSpace = false) const;
    bool fitsOnLineIncludingExtraWidth(float extra) const;
    bool fitsOnLineExcludingTrailingWhitespace(float extra) const;

    float currentWidth() const { return m_committedWidth + m_uncommittedWidth; }
    // FIXME: We should eventually replace these three functions by ones that work on a higher abstraction.
    float uncommittedWidth() const { return m_uncommittedWidth; }
    float committedWidth() const { return m_committedWidth; }
    float availableWidth() const { return m_availableWidth; }
    float logicalLeftOffset() const { return m_left; }
    
    bool hasCommitted() const { return m_hasCommitted; }
    bool hasCommittedReplaced() const { return m_hasCommittedReplaced; }

    void updateAvailableWidth(LayoutUnit minimumHeight = 0_lu);
    void shrinkAvailableWidthForNewFloatIfNeeded(const FloatingObject&);
    void addUncommittedWidth(float delta)
    {
        m_uncommittedWidth += delta;
    }
    void addUncommittedReplacedWidth(float delta)
    {
        addUncommittedWidth(delta);
        m_hasUncommittedReplaced = true;
    }
    void commit();
    void fitBelowFloats(bool isFirstLine = false);
    void setTrailingWhitespaceWidth(float collapsedWhitespace, float borderPaddingMargin = 0);

    bool isFirstLine() const { return m_isFirstLine; }

private:
    void computeAvailableWidthFromLeftAndRight();
    bool fitsOnLineExcludingTrailingCollapsedWhitespace() const;
    void updateLineDimension(LayoutUnit newLineTop, LayoutUnit newLineWidth, float newLineLeft, float newLineRight);
    void wrapNextToShapeOutside(bool isFirstLine);

    RenderBlockFlow& m_block;
    float m_uncommittedWidth { 0 };
    float m_committedWidth { 0 };
    float m_trailingWhitespaceWidth { 0 };
    float m_trailingCollapsedWhitespaceWidth { 0 };
    float m_left { 0 };
    float m_right { 0 };
    float m_availableWidth { 0 };
    bool m_isFirstLine { true };
    bool m_hasCommitted { false };
    bool m_hasCommittedReplaced { false };
    bool m_hasUncommittedReplaced { false };
};

} // namespace WebCore
