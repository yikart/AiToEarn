/*
 * Copyright (C) 2023-2024 Apple Inc. All rights reserved.
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

#include "RenderingResourceIdentifier.h"
#include <variant>
#include <wtf/OptionSet.h>

namespace WTF {
class TextStream;
}

namespace WebCore {

class ControlFactory;
class GraphicsContext;

namespace DisplayList {

class ResourceHeap;

class ApplyDeviceScaleFactor;
class BeginTransparencyLayer;
class BeginTransparencyLayerWithCompositeMode;
class ClearRect;
class ClearDropShadow;
class Clip;
class ClipRoundedRect;
class ClipOut;
class ClipOutRoundedRect;
class ClipOutToPath;
class ClipPath;
class ClipToImageBuffer;
class ConcatenateCTM;
class DrawControlPart;
class DrawDotsForDocumentMarker;
class DrawEllipse;
class DrawFilteredImageBuffer;
class DrawFocusRingPath;
class DrawFocusRingRects;
class DrawGlyphs;
class DrawDecomposedGlyphs;
class DrawDisplayListItems;
class DrawImageBuffer;
class DrawLine;
class DrawLinesForText;
class DrawNativeImage;
class DrawPath;
class DrawPattern;
class DrawRect;
class DrawSystemImage;
class EndTransparencyLayer;
class FillCompositedRect;
class FillEllipse;
class FillPathSegment;
class FillPath;
class FillRect;
class FillRectWithColor;
class FillRectWithGradient;
class FillRectWithGradientAndSpaceTransform;
class FillRectWithRoundedHole;
class FillRoundedRect;
class ResetClip;
class Restore;
class Rotate;
class Save;
class Scale;
class SetCTM;
class SetInlineFillColor;
class SetInlineStroke;
class SetLineCap;
class SetLineDash;
class SetLineJoin;
class SetMiterLimit;
class SetState;
class StrokeEllipse;
class StrokeLine;
class StrokePathSegment;
class StrokePath;
class StrokeRect;
class Translate;
#if ENABLE(INLINE_PATH_DATA)
class FillLine;
class FillArc;
class FillClosedArc;
class FillQuadCurve;
class FillBezierCurve;
class StrokeArc;
class StrokeClosedArc;
class StrokeQuadCurve;
class StrokeBezierCurve;
#endif
#if USE(CG)
class ApplyFillPattern;
class ApplyStrokePattern;
#endif
class BeginPage;
class EndPage;

using Item = std::variant
    < ApplyDeviceScaleFactor
    , BeginTransparencyLayer
    , BeginTransparencyLayerWithCompositeMode
    , ClearRect
    , ClearDropShadow
    , Clip
    , ClipRoundedRect
    , ClipOut
    , ClipOutRoundedRect
    , ClipOutToPath
    , ClipPath
    , ClipToImageBuffer
    , ConcatenateCTM
    , DrawControlPart
    , DrawDotsForDocumentMarker
    , DrawEllipse
    , DrawFilteredImageBuffer
    , DrawFocusRingPath
    , DrawFocusRingRects
    , DrawGlyphs
    , DrawDecomposedGlyphs
    , DrawDisplayListItems
    , DrawImageBuffer
    , DrawLine
    , DrawLinesForText
    , DrawNativeImage
    , DrawPath
    , DrawPattern
    , DrawRect
    , DrawSystemImage
    , EndTransparencyLayer
    , FillCompositedRect
    , FillEllipse
    , FillPathSegment
    , FillPath
    , FillRect
    , FillRectWithColor
    , FillRectWithGradient
    , FillRectWithGradientAndSpaceTransform
    , FillRectWithRoundedHole
    , FillRoundedRect
    , ResetClip
    , Restore
    , Rotate
    , Save
    , Scale
    , SetCTM
    , SetInlineFillColor
    , SetInlineStroke
    , SetLineCap
    , SetLineDash
    , SetLineJoin
    , SetMiterLimit
    , SetState
    , StrokeEllipse
    , StrokeLine
    , StrokePathSegment
    , StrokePath
    , StrokeRect
    , Translate
#if ENABLE(INLINE_PATH_DATA)
    , FillLine
    , FillArc
    , FillClosedArc
    , FillQuadCurve
    , FillBezierCurve
    , StrokeArc
    , StrokeClosedArc
    , StrokeQuadCurve
    , StrokeBezierCurve
#endif
#if USE(CG)
    , ApplyFillPattern
    , ApplyStrokePattern
#endif
    , BeginPage
    , EndPage
>;

enum class StopReplayReason : uint8_t {
    ReplayedAllItems,
    MissingCachedResource,
    InvalidItemOrExtent,
    OutOfMemory
};

struct ApplyItemResult {
    std::optional<StopReplayReason> stopReason;
    std::optional<RenderingResourceIdentifier> resourceIdentifier;
};

enum class ReplayOption : uint8_t {
    FlushImagesAndWaitForCompletion = 1 << 0,
};

enum class AsTextFlag : uint8_t {
    IncludePlatformOperations      = 1 << 0,
    IncludeResourceIdentifiers     = 1 << 1,
};

bool isValid(const Item&);

ApplyItemResult applyItem(GraphicsContext&, const ResourceHeap&, ControlFactory&, const Item&, OptionSet<ReplayOption>);

bool shouldDumpItem(const Item&, OptionSet<AsTextFlag>);

WEBCORE_EXPORT void dumpItem(TextStream&, const Item&, OptionSet<AsTextFlag>);

WEBCORE_EXPORT TextStream& operator<<(TextStream&, const Item&);

} // namespace DisplayList
} // namespace WebCore
