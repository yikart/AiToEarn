/*
 * Copyright (C) 2023 Apple Inc. All rights reserved.
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

#if ENABLE(THREADED_ANIMATION_RESOLUTION)

#include "FilterOperations.h"
#include "Length.h"
#include "LengthPoint.h"
#include "OffsetRotation.h"
#include "PathOperation.h"
#include "RenderStyleConstants.h"
#include "RotateTransformOperation.h"
#include "ScaleTransformOperation.h"
#include "TransformOperations.h"
#include "TransformationMatrix.h"
#include "TranslateTransformOperation.h"

namespace WebCore {

class IntRect;
class Path;
class RenderLayerModelObject;
class RenderStyle;

struct AcceleratedEffectValues {
    float opacity { 1 };
    std::optional<TransformOperationData> transformOperationData;
    LengthPoint transformOrigin { };
    TransformBox transformBox { TransformBox::ContentBox };
    TransformOperations transform { };
    RefPtr<TransformOperation> translate;
    RefPtr<TransformOperation> scale;
    RefPtr<TransformOperation> rotate;
    RefPtr<PathOperation> offsetPath;
    Length offsetDistance { };
    LengthPoint offsetPosition { };
    LengthPoint offsetAnchor { };
    OffsetRotation offsetRotate { };
    FilterOperations filter { };
    FilterOperations backdropFilter { };

    AcceleratedEffectValues() = default;
    AcceleratedEffectValues(const RenderStyle&, const IntRect&, const RenderLayerModelObject* = nullptr);
    AcceleratedEffectValues(float opacity, std::optional<TransformOperationData>&& transformOperationData, LengthPoint&& transformOrigin, TransformBox transformBox, TransformOperations&& transform, RefPtr<TransformOperation>&& translate, RefPtr<TransformOperation>&& scale, RefPtr<TransformOperation>&& rotate, RefPtr<PathOperation>&& offsetPath, Length&& offsetDistance, LengthPoint&& offsetPosition, LengthPoint&& offsetAnchor, OffsetRotation&& offsetRotate, FilterOperations&& filter, FilterOperations&& backdropFilter)
        : opacity(opacity)
        , transformOperationData(WTFMove(transformOperationData))
        , transformOrigin(WTFMove(transformOrigin))
        , transformBox(transformBox)
        , transform(WTFMove(transform))
        , translate(WTFMove(translate))
        , scale(WTFMove(scale))
        , rotate(WTFMove(rotate))
        , offsetPath(WTFMove(offsetPath))
        , offsetDistance(WTFMove(offsetDistance))
        , offsetPosition(WTFMove(offsetPosition))
        , offsetAnchor(WTFMove(offsetAnchor))
        , offsetRotate(WTFMove(offsetRotate))
        , filter(WTFMove(filter))
        , backdropFilter(WTFMove(backdropFilter))
    {
    }

    WEBCORE_EXPORT AcceleratedEffectValues clone() const;
    WEBCORE_EXPORT TransformationMatrix computedTransformationMatrix(const FloatRect&) const;
};

} // namespace WebCore

#endif // ENABLE(THREADED_ANIMATION_RESOLUTION)
