/*
 * Copyright (C) 2019-2023 Apple Inc. All rights reserved.
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

#include "ExceptionOr.h"
#include "Position.h"
#include "Range.h"
#include "StaticRange.h"
#include <wtf/RefCountedAndCanMakeWeakPtr.h>

namespace WebCore {

class CSSStyleDeclaration;
class DOMSetAdapter;
class PropertySetCSSStyleDeclaration;

class HighlightRange : public RefCountedAndCanMakeWeakPtr<HighlightRange> {
public:
    static Ref<HighlightRange> create(Ref<AbstractRange>&& range)
    {
        return adoptRef(*new HighlightRange(WTFMove(range)));
    }

    AbstractRange& range() const { return m_range.get(); }
    const Position& startPosition() const { return m_startPosition; }
    void setStartPosition(Position&& startPosition) { m_startPosition = WTFMove(startPosition); }
    const Position& endPosition() const { return m_endPosition; }
    void setEndPosition(Position&& endPosition) { m_endPosition = WTFMove(endPosition); }

private:
    explicit HighlightRange(Ref<AbstractRange>&& range)
        : m_range(WTFMove(range))
    {
        if (auto liveRange = dynamicDowncast<Range>(m_range))
            liveRange->didAssociateWithHighlight();
    }

    Ref<AbstractRange> m_range;
    Position m_startPosition;
    Position m_endPosition;
};

class Highlight : public RefCounted<Highlight> {
public:
    WEBCORE_EXPORT static Ref<Highlight> create(FixedVector<std::reference_wrapper<AbstractRange>>&&);
    static void repaintRange(const AbstractRange&);
    void clearFromSetLike();
    bool addToSetLike(AbstractRange&);
    bool removeFromSetLike(const AbstractRange&);
    void initializeSetLike(DOMSetAdapter&);

    enum class Type : uint8_t { Highlight, SpellingError, GrammarError };
    Type type() const { return m_type; }
    void setType(Type type) { m_type = type; }

    int priority() const { return m_priority; }
    void setPriority(int);

    void repaint();
    const Vector<Ref<HighlightRange>>& highlightRanges() const { return m_highlightRanges; }

private:
    explicit Highlight(FixedVector<std::reference_wrapper<AbstractRange>>&&);

    Vector<Ref<HighlightRange>> m_highlightRanges;
    Type m_type { Type::Highlight };
    int m_priority { 0 };
};

} // namespace WebCore
