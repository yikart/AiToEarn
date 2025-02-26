/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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

#include "ExpressionInfo.h"

namespace JSC {

template<typename RemapFunc>
void ExpressionInfo::Encoder::remap(Vector<unsigned>&& adjustmentLabelPoints, RemapFunc remapFunc)
{
    if (!adjustmentLabelPoints.size())
        return; // Nothing to adjust.

    // Pad the end with a value that exceeds all other bytecodeIndexes.
    // This way, currentLabel below will always has a meaningful value
    // to compare instPC against.
    adjustmentLabelPoints.append(UINT_MAX);

    ExpressionInfo::Decoder decoder(m_expressionInfoEncodedInfo);
    unsigned numEncodedInfo = m_expressionInfoEncodedInfo.size();

    // These are the types of adjustments that we need to handle:
    // 1. bytecode got inserted before a LabelPoint.
    // 2. bytecode got inserted after the LabelPoint.
    // 3. bytecode got deleted after the LabelPoint.
    //
    // This means that we only need to do a remap of InstPC for the following:
    //
    // a. the EncodedInfo Entry at a LabelPoint InstPC (due to (1) above).
    //
    //    In this case, the InstPC increased. Our remap will add a delta for the increment.
    //    Since our EncodedInfo are expressed as deltas from the previous Entry, once an
    //    adjustment has been applied, subsequent entries will just pick it up for free.
    //
    // b. the EncodedInfo Entry right after the LabelPoint InstPC (due to (2) and (3) above).
    //
    //    Inserting / Removing bytecode after the LabelPoint affects the InstPC of bytecode
    //    that follows the LabelPoint starting with the bytecode immediately after. There may
    //    or may not be any ExpressionInfo Entry for these bytecode. However, we can just be
    //    conservative, and go ahead to compute the remap for the next Entry anyway. After
    //    that, our delta cummulation scheme takes care of the rest.
    //
    //    There's also a chance that the next Entry is already beyond the next LabelPoint.
    //    This is also fine because our remap is computed based on the absolute value of its
    //    InstPC, not its relative value. Hence, there is no adjusment error: we'll always
    //    get the correct remapped InstPC value.
    //
    // c. the EncodedInfo Entry that start with an AbsInstPC.
    //
    //    Above, we pointed out that because our EncodedInfo are expressed as deltas from
    //    the previous Entry, adjustments are picked up for free. There is one exception:
    //    AbsInstPC. AbsInstPC does not build on cummulative deltas. So, whenever we see an
    //    AbsInstPC, we must also remap it.

    unsigned adjustmentIndex = 0;
    InstPC currentLabel = adjustmentLabelPoints[adjustmentIndex];
    bool needToAdjustLabelAfter = false;
    unsigned cummulativeDelta = 0;

    while (decoder.decode() != IterationStatus::Done) {
        bool isAbsInstPC = decoder.currentInfo()->isAbsInstPC();
        bool needRemap = isAbsInstPC;

        InstPC instPC = decoder.instPC();
        if (instPC >= currentLabel) {
            needToAdjustLabelAfter = true;
            needRemap = true;
            currentLabel = adjustmentLabelPoints[++adjustmentIndex];

        } else if (needToAdjustLabelAfter) {
            needToAdjustLabelAfter = false;
            needRemap = true;
        }

        unsigned instPCDelta;
        if (needRemap) {
            if (isAbsInstPC)
                cummulativeDelta = 0;
            instPCDelta = remapFunc(instPC) - instPC - cummulativeDelta;
            if (instPCDelta || isAbsInstPC) {
                adjustInstPC(decoder.currentInfo(), instPCDelta);

                // adjustInstPC() may have resized and reallocated m_expressionInfoEncodedInfo.
                // So, we need to re-compute endInfo. info will be re-computed at the top of the loop.
                decoder.recacheInfo(m_expressionInfoEncodedInfo);
                cummulativeDelta += instPCDelta;
            }
        }
    }
    m_numberOfEncodedInfoExtensions = m_expressionInfoEncodedInfo.size() - numEncodedInfo;

    // Now, let's remap the Chapter startInstPCs. Their startEncodedInfoIndex will not change because
    // the above remap algorithm does in place remapping.
    for (auto& chapter : m_expressionInfoChapters)
        chapter.startInstPC = remapFunc(chapter.startInstPC);
}

} // namespace JSC
