/*
 * Copyright (C) 2016-2023 Apple Inc. All rights reserved.
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

#include "DisplayList.h"
#include "DisplayListItem.h"
#include <wtf/Noncopyable.h>

namespace WebCore {

class ControlFactory;
class FloatRect;
class GraphicsContext;

namespace DisplayList {

class DisplayList;
class ResourceHeap;

struct ReplayResult {
    std::unique_ptr<DisplayList> trackedDisplayList;
    std::optional<RenderingResourceIdentifier> missingCachedResourceIdentifier;
    StopReplayReason reasonForStopping { StopReplayReason::ReplayedAllItems };
};

class Replayer {
    WTF_MAKE_NONCOPYABLE(Replayer);
public:
    WEBCORE_EXPORT Replayer(GraphicsContext&, const DisplayList&);
    WEBCORE_EXPORT Replayer(GraphicsContext&, const Vector<Item>&, const ResourceHeap&, ControlFactory&, OptionSet<ReplayOption> = { });
    ~Replayer() = default;

    WEBCORE_EXPORT ReplayResult replay(const FloatRect& initialClip = { }, bool trackReplayList = false);

private:
    GraphicsContext& m_context;
    const Vector<Item>& m_items;
    const ResourceHeap& m_resourceHeap;
    Ref<ControlFactory> m_controlFactory;
    OptionSet<ReplayOption> m_options;
};

} // namespace DisplayList
} // namespace WebCore
