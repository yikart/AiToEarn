/*
 * Copyright (C) 2020 Apple Inc. All rights reserved.
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

#include "RenderHighlight.h"
#include "RenderSelectionGeometry.h"
#if ENABLE(SERVICE_CONTROLS)
#include "SelectionGeometryGatherer.h"
#endif

namespace WebCore {

class RenderSelection : public RenderHighlight {
public:
    RenderSelection(RenderView&);
    
    enum class RepaintMode { NewXOROld, NewMinusOld, Nothing };
    void set(const RenderRange&, RepaintMode = RepaintMode::NewXOROld);
    void clear();
    void repaint() const;
    
    IntRect bounds() const { return collectBounds(ClipToVisibleContent::No); }
    IntRect boundsClippedToVisibleContent() const { return collectBounds(ClipToVisibleContent::Yes); }
    
private:
    const RenderView& m_renderView;
#if ENABLE(SERVICE_CONTROLS)
    SelectionGeometryGatherer m_selectionGeometryGatherer;
#endif
    bool m_selectionWasCaret { false };
    enum class ClipToVisibleContent : bool { No, Yes };
    IntRect collectBounds(ClipToVisibleContent) const;
    void apply(const RenderRange&, RepaintMode);
};

} // namespace WebCore
