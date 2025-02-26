/*
 * Copyright (C) 2013-2017 Apple Inc. All rights reserved.
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

#import <QuartzCore/QuartzCore.h>

#ifdef __cplusplus
#import "FloatPoint.h"
#import "ScrollingNodeID.h"
#import <wtf/Vector.h>
#endif

@interface CALayer (WebCoreCALayerExtras)

+ (CALayer *)_web_renderLayerWithContextID:(uint32_t)contextID shouldPreserveFlip:(BOOL)preservesFlip;

- (void)web_disableAllActions;
- (void)_web_setLayerBoundsOrigin:(CGPoint)origin;
- (void)_web_setLayerTopLeftPosition:(CGPoint)position;
- (BOOL)_web_maskContainsPoint:(CGPoint)point;
- (BOOL)_web_maskMayIntersectRect:(CGRect)rect;
- (void)_web_clearContents;

#if ENABLE(RE_DYNAMIC_CONTENT_SCALING)
- (void)_web_clearDynamicContentScalingDisplayListIfNeeded;
#endif

@end

#ifdef __cplusplus

namespace WebCore {

using LayerAndPoint = std::pair<CALayer *, FloatPoint>;
WEBCORE_EXPORT void collectDescendantLayersAtPoint(Vector<LayerAndPoint, 16>& layersAtPoint, CALayer *parent, CGPoint, const std::function<bool(CALayer *, CGPoint localPoint)>& pointInLayerFunction = { });

WEBCORE_EXPORT Vector<LayerAndPoint, 16> layersAtPointToCheckForScrolling(std::function<bool(CALayer*, CGPoint)> layerEventRegionContainsPoint, std::function<std::optional<ScrollingNodeID>(CALayer*)> scrollingNodeIDForLayer, CALayer*, const FloatPoint&, bool& hasAnyNonInteractiveScrollingLayers);

} // namespace WebCore

#endif // __cplusplus
