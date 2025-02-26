/*
 * Copyright (C) 2020-2023 Apple Inc. All rights reserved.
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
#include "DisplayListRecorderImpl.h"
#include "GraphicsContext.h"
#include <wtf/TZoneMalloc.h>

namespace WebCore {
namespace DisplayList {

class DrawingContext {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(DrawingContext, WEBCORE_EXPORT);
public:
    WEBCORE_EXPORT DrawingContext(const FloatSize& logicalSize, const AffineTransform& initialCTM = { }, const DestinationColorSpace& = DestinationColorSpace::SRGB());
    WEBCORE_EXPORT ~DrawingContext();

    GraphicsContext& context() const { return const_cast<DrawingContext&>(*this).m_context; }
    RecorderImpl& recorder() { return m_context; };
    DisplayList& displayList() { return m_displayList; }
    const DisplayList& displayList() const { return m_displayList; }
    const DisplayList* replayedDisplayList() const { return m_replayedDisplayList.get(); }

    WEBCORE_EXPORT void setTracksDisplayListReplay(bool);
    WEBCORE_EXPORT void replayDisplayList(GraphicsContext&);

protected:
    RecorderImpl m_context;
    DisplayList m_displayList;
    std::unique_ptr<DisplayList> m_replayedDisplayList;
    bool m_tracksDisplayListReplay { false };
};

} // DisplayList
} // WebCore
