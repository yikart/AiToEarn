/*
 * Copyright (C) 2014, 2015 Apple Inc. All rights reserved.
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

#if ENABLE(CONTENT_EXTENSIONS)

#include "ContentExtensionsDebugging.h"
#include <wtf/Vector.h>

namespace WebCore {

namespace ContentExtensions {

struct DFA;

struct CharRange {
    signed char first;
    signed char last;
    unsigned size() const { return last - first + 1; }
};

// A DFANode abstract the transition table out of a DFA state. If a state is accepting, the DFANode also have
// the actions for that state.
class DFANode {
public:
    struct ConstRangeIterator {
        const DFA& dfa;
        uint32_t position;

        const ConstRangeIterator& operator*() const { return *this; }

        bool operator==(const ConstRangeIterator& other) const
        {
            ASSERT(&dfa  == &other.dfa);
            return position == other.position;
        }

        ConstRangeIterator& operator++()
        {
            ++position;
            return *this;
        }

        const CharRange& range() const;
        uint32_t target() const;

        char first() const { return range().first; }
        char last() const { return range().last; }
        uint32_t data() const { return target(); }
    };

    struct IterableConstRange {
        const DFA& dfa;
        uint32_t rangesStart;
        uint32_t rangesEnd;

        ConstRangeIterator begin() const { return { dfa, rangesStart }; }
        ConstRangeIterator end() const { return { dfa, rangesEnd }; }
    };

    IterableConstRange transitions(const DFA& dfa) const
    {
        return IterableConstRange { dfa, m_transitionsStart, m_transitionsStart + m_transitionsLength };
    }

    struct RangeIterator {
        DFA& dfa;
        uint32_t position;

        RangeIterator& operator*() { return *this; }

        bool operator==(const RangeIterator& other) const
        {
            ASSERT(&dfa  == &other.dfa);
            return position == other.position;
        }

        RangeIterator& operator++()
        {
            ++position;
            return *this;
        }

        const CharRange& range() const;
        uint32_t target() const;
        void resetTarget(uint32_t);

        char first() const { return range().first; }
        char last() const { return range().last; }
        uint32_t data() const { return target(); }
    };

    struct IterableRange {
        DFA& dfa;
        uint32_t rangesStart;
        uint32_t rangesEnd;

        RangeIterator begin() const { return { dfa, rangesStart }; }
        RangeIterator end() const { return { dfa, rangesEnd }; }
    };

    IterableRange transitions(DFA& dfa)
    {
        return IterableRange { dfa, m_transitionsStart, m_transitionsStart + m_transitionsLength };
    }

    // FIXME: Stop minimizing killed nodes and add ASSERT(!isKilled()) in many functions here.
    void kill(DFA&);
    Vector<uint64_t> actions(const DFA&) const;
    bool containsTransition(char, const DFA&) const;
    
    bool isKilled() const { return m_flags & IsKilled; }
    bool hasActions() const { return !!m_actionsLength; }
    uint16_t actionsLength() const { return m_actionsLength; }
    uint32_t actionsStart() const { return m_actionsStart; }

    bool canUseFallbackTransition(const DFA&) const;
    uint32_t bestFallbackTarget(const DFA&) const;

    void setActions(uint32_t start, uint16_t length)
    {
        ASSERT(!m_actionsLength);
        m_actionsStart = start;
        m_actionsLength = length;
    }
    void setTransitions(uint32_t start, uint16_t length)
    {
        ASSERT(!m_transitionsStart);
        ASSERT(!m_transitionsLength);
        m_transitionsStart = start;
        m_transitionsLength = length;
    }

private:
    uint32_t m_actionsStart { 0 };
    uint32_t m_transitionsStart { 0 };
    uint16_t m_actionsLength { 0 };
    uint8_t m_transitionsLength { 0 };
    
    uint8_t m_flags { 0 };
    static constexpr uint8_t IsKilled = 0x01;
};

static_assert(sizeof(DFANode) <= 16, "Keep the DFANodes small");

} // namespace ContentExtensions
} // namespace WebCore

#endif // ENABLE(CONTENT_EXTENSIONS)
