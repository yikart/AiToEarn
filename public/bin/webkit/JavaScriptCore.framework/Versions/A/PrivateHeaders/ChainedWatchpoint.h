/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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

#include "PackedCellPtr.h"
#include "Watchpoint.h"

namespace JSC {

class ChainedWatchpoint final : public Watchpoint {
public:
    ChainedWatchpoint(JSCell* owner, InlineWatchpointSet& watchpointSet)
        : Watchpoint(Watchpoint::Type::Chained)
        , m_owner(owner)
        , m_watchpointSet(watchpointSet)
    {
        RELEASE_ASSERT(watchpointSet.state() == IsWatched);
    }

    void install(InlineWatchpointSet& fromWatchpoint, VM&);

    void fireInternal(VM&, const FireDetail&);

private:
    PackedCellPtr<JSCell> m_owner;
    InlineWatchpointSet& m_watchpointSet;
};

inline void ChainedWatchpoint::install(InlineWatchpointSet& fromWatchpoint, VM&)
{
    fromWatchpoint.add(this);
}

inline void ChainedWatchpoint::fireInternal(VM& vm, const FireDetail&)
{
    if (!m_owner->isPendingDestruction())
        m_watchpointSet.fireAll(vm, StringFireDetail("chained watchpoint is fired."));
}

} // namespace JSC
