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
#include "DFANode.h"
#include <wtf/Vector.h>

namespace WebCore {

namespace ContentExtensions {

// The DFA abstract a partial DFA graph in a compact form.
struct WEBCORE_EXPORT DFA {
    static DFA empty();

    void minimize();
    unsigned graphSize() const;
    size_t memoryUsed() const;

#if CONTENT_EXTENSIONS_STATE_MACHINE_DEBUGGING
    void debugPrintDot() const;
#endif

    Vector<DFANode, 0, ContentExtensionsOverflowHandler> nodes;
    Vector<uint64_t, 0, ContentExtensionsOverflowHandler> actions;
    Vector<CharRange, 0, ContentExtensionsOverflowHandler> transitionRanges;
    Vector<uint32_t, 0, ContentExtensionsOverflowHandler> transitionDestinations;
    unsigned root { 0 };
};

inline const CharRange& DFANode::ConstRangeIterator::range() const
{
    return dfa.transitionRanges[position];
}

inline uint32_t DFANode::ConstRangeIterator::target() const
{
    return dfa.transitionDestinations[position];
}

inline const CharRange& DFANode::RangeIterator::range() const
{
    return dfa.transitionRanges[position];
}

inline uint32_t DFANode::RangeIterator::target() const
{
    return dfa.transitionDestinations[position];
}

inline void DFANode::RangeIterator::resetTarget(uint32_t newTarget)
{
    dfa.transitionDestinations[position] = newTarget;
}

} // namespace ContentExtensions
} // namespace WebCore

#endif // ENABLE(CONTENT_EXTENSIONS)
