/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

template <typename CharacterType>
struct ImmutableRange {
    uint32_t targetStart;
    uint32_t targetEnd;
    CharacterType first;
    CharacterType last;
};

struct ImmutableNFANode {
    uint32_t rangesStart { 0 };
    uint32_t rangesEnd { 0 };
    uint32_t epsilonTransitionTargetsStart { 0 };
    uint32_t epsilonTransitionTargetsEnd { 0 };
    uint32_t actionStart { 0 };
    uint32_t actionEnd { 0 };
};

template <typename CharacterType, typename ActionType>
struct ImmutableNFA {
    Vector<ImmutableNFANode, 0, ContentExtensionsOverflowHandler> nodes;
    Vector<ImmutableRange<CharacterType>, 0, ContentExtensionsOverflowHandler> transitions;
    Vector<uint32_t, 0, ContentExtensionsOverflowHandler> targets;
    Vector<uint32_t, 0, ContentExtensionsOverflowHandler> epsilonTransitionsTargets;
    Vector<ActionType, 0, ContentExtensionsOverflowHandler> actions;

    void clear()
    {
        nodes.clear();
        transitions.clear();
        targets.clear();
        epsilonTransitionsTargets.clear();
        actions.clear();
    }

    size_t memoryUsed() const
    {
        return nodes.capacity() * sizeof(ImmutableNFANode)
            + transitions.capacity() * sizeof(ImmutableRange<CharacterType>)
            + targets.capacity() * sizeof(uint32_t)
            + epsilonTransitionsTargets.capacity() * sizeof(uint32_t)
            + actions.capacity() * sizeof(ActionType);
    }
};

} // namespace ContentExtensions
} // namespace WebCore

#endif // ENABLE(CONTENT_EXTENSIONS)
