/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

#include "LegacyInlineFlowBox.h"
#include "LineWidth.h"
#include "RenderLineBoxList.h"
#include "RenderStyleConstants.h"
#include "TrailingObjects.h"
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class BidiContext;
class FloatingObject;
class FloatWithRect;
class LegacyInlineBox;
class LegacyInlineIterator;
class LineInfo;
class LocalFrameViewLayoutContext;
class RenderBlockFlow;
class RenderObject;
class LegacyRootInlineBox;
struct BidiStatus;
struct WordMeasurement;

template <class Run> class BidiRunList;

class LegacyLineLayout {
    WTF_MAKE_TZONE_ALLOCATED(LegacyLineLayout);
public:
    LegacyLineLayout(RenderBlockFlow&);
    ~LegacyLineLayout();

    RenderLineBoxList& lineBoxes() { return m_lineBoxes; }
    const RenderLineBoxList& lineBoxes() const { return m_lineBoxes; }

    LegacyRootInlineBox* legacyRootBox() const { return downcast<LegacyRootInlineBox>(m_lineBoxes.firstLegacyLineBox()); }

    void layoutLineBoxes();

    LegacyRootInlineBox* constructLine(BidiRunList<BidiRun>&, const LineInfo&);
    void addOverflowFromInlineChildren();

    size_t lineCount() const;

    static void appendRunsForObject(BidiRunList<BidiRun>*, int start, int end, RenderObject&, InlineBidiResolver&);

private:
    std::unique_ptr<LegacyRootInlineBox> createRootInlineBox();
    LegacyRootInlineBox* createAndAppendRootInlineBox();
    LegacyInlineBox* createInlineBoxForRenderer(RenderObject*);
    LegacyInlineFlowBox* createLineBoxes(RenderObject*, const LineInfo&, LegacyInlineBox*);
    void removeInlineBox(BidiRun&, const LegacyRootInlineBox&) const;
    void removeEmptyTextBoxesAndUpdateVisualReordering(LegacyRootInlineBox*, BidiRun* firstRun);
    inline BidiRun* handleTrailingSpaces(BidiRunList<BidiRun>& bidiRuns, BidiContext* currentContext);
    LegacyRootInlineBox* createLineBoxesFromBidiRuns(unsigned bidiLevel, BidiRunList<BidiRun>& bidiRuns, const LegacyInlineIterator& end, LineInfo&);
    void layoutRunsAndFloats(bool hasInlineChild);
    void layoutRunsAndFloatsInRange(InlineBidiResolver&);

    const RenderStyle& style() const;
    const LocalFrameViewLayoutContext& layoutContext() const;

    RenderBlockFlow& m_flow;
    RenderLineBoxList m_lineBoxes;
};

};
