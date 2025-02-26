 /*
 * Copyright (C) 2014 Igalia S.L.
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER “AS IS” AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
 * OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
 * THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 */

#pragma once

#include "RenderObject.h"

namespace WebCore {

struct TextBoxSelectableRange;

class HighlightRange;
class RenderMultiColumnSpannerPlaceholder;
class RenderText;

class RenderRange {
public:
    RenderRange() = default;
    RenderRange(RenderObject* start, RenderObject* end, unsigned startOffset, unsigned endOffset)
        : m_start(start)
        , m_end(end)
        , m_startOffset(startOffset)
        , m_endOffset(endOffset)
    {
    }

    RenderObject* start() const { return m_start.get(); }
    RenderObject* end() const { return m_end.get(); }
    unsigned startOffset() const { return m_startOffset; }
    unsigned endOffset() const { return m_endOffset; }

    friend bool operator==(const RenderRange&, const RenderRange&) = default;

private:
    SingleThreadWeakPtr<RenderObject> m_start;
    SingleThreadWeakPtr<RenderObject> m_end;
    unsigned m_startOffset { 0 };
    unsigned m_endOffset { 0 };
};
    
class RenderRangeIterator {
public:
    RenderRangeIterator(RenderObject* start);
    RenderObject* current() const;
    RenderObject* next();
    
private:
    void checkForSpanner();
    
    RenderObject* m_current { nullptr };
    Vector<RenderMultiColumnSpannerPlaceholder*> m_spannerStack;
};

class RenderHighlight {
public:
    enum IsSelectionTag { IsSelection };
    RenderHighlight() = default;
    RenderHighlight(IsSelectionTag)
        : m_isSelection(true)
    { }

    void setRenderRange(const RenderRange&);
    bool setRenderRange(const HighlightRange&); // Returns true if successful.
    const RenderRange& get() const { return m_renderRange; }

    RenderObject* start() const { return m_renderRange.start(); }
    RenderObject* end() const { return m_renderRange.end(); }

    unsigned startOffset() const { return m_renderRange.startOffset(); }
    unsigned endOffset() const { return m_renderRange.endOffset(); }

    RenderObject::HighlightState highlightStateForRenderer(const RenderObject&);
    RenderObject::HighlightState highlightStateForTextBox(const RenderText&, const TextBoxSelectableRange&);
    std::pair<unsigned, unsigned> rangeForTextBox(const RenderText&, const TextBoxSelectableRange&);

protected:
    RenderRange m_renderRange;
    const bool m_isSelection { false };
};

} // namespace WebCore
