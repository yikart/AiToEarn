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

#include "ElementIdentifier.h"
#include "FloatPoint.h"
#include "FloatRect.h"
#include "FrameIdentifier.h"
#include "RectEdges.h"
#include "RenderStyleConstants.h"
#include "ScriptExecutionContextIdentifier.h"
#include <wtf/URLHash.h>
#include <wtf/Vector.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

using TargetedElementSelectors = Vector<HashSet<String>>;
using TargetedElementIdentifiers = std::pair<ElementIdentifier, ScriptExecutionContextIdentifier>;

struct TargetedElementAdjustment {
    TargetedElementIdentifiers identifiers;
    TargetedElementSelectors selectors;
};

struct TargetedElementRequest {
    std::variant<FloatPoint, String, TargetedElementSelectors> data;
    bool canIncludeNearbyElements { true };
    bool shouldIgnorePointerEventsNone { true };
};

struct TargetedElementInfo {
    ElementIdentifier elementIdentifier;
    ScriptExecutionContextIdentifier documentIdentifier;
    RectEdges<bool> offsetEdges;
    String renderedText;
    String searchableText;
    String screenReaderText;
    Vector<Vector<String>> selectors;
    FloatRect boundsInRootView;
    FloatRect boundsInClientCoordinates;
    PositionType positionType { PositionType::Static };
    Vector<FrameIdentifier> childFrameIdentifiers;
    HashSet<URL> mediaAndLinkURLs;
    bool isNearbyTarget { true };
    bool isPseudoElement { false };
    bool isInShadowTree { false };
    bool isInVisibilityAdjustmentSubtree { false };
    bool hasLargeReplacedDescendant { false };
    bool hasAudibleMedia { false };
};

} // namespace WebCore
