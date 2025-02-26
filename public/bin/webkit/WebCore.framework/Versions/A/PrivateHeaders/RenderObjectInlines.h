/**
 * Copyright (C) 2023 Apple Inc. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public License
 * along with this library; see the file COPYING.LIB.  If not, write to
 * the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA 02110-1301, USA.
 */

#pragma once

#include "Document.h"
#include "RenderObject.h"
#include "RenderStyleInlines.h"
#include "RenderView.h"

namespace WebCore {

inline bool RenderObject::hasTransformOrPerspective() const { return hasTransformRelatedProperty() && (isTransformed() || style().hasPerspective()); }
inline bool RenderObject::isAtomicInlineLevelBox() const { return style().isDisplayInlineType() && !(style().display() == DisplayType::Inline && !isReplacedOrInlineBlock()); }
inline bool RenderObject::isBlockLevelBox() const { return style().isDisplayBlockLevel(); }
inline bool RenderObject::isTransformed() const { return hasTransformRelatedProperty() && (style().affectsTransform() || hasSVGTransform()); }
inline bool RenderObject::preservesNewline() const { return !isRenderSVGInlineText() && style().preserveNewline(); }
inline Ref<Document> RenderObject::protectedDocument() const { return document(); }
inline const LocalFrameViewLayoutContext& RenderObject::layoutContext() const { return view().frameView().layoutContext(); }

} // namespace WebCore
