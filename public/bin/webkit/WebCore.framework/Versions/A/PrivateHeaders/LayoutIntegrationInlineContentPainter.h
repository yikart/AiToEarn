/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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

#include "LayoutIntegrationBoxTreeUpdater.h"
#include "LayoutPoint.h"
#include "LayoutRect.h"
#include <wtf/WeakListHashSet.h>

namespace WebCore {

class RenderBlock;
class RenderBlockFlow;
class RenderBox;
class RenderInline;

struct PaintInfo;

namespace InlineDisplay {
struct Box;
};

namespace Layout {
class ElementBox;
};

namespace LayoutIntegration {

struct InlineContent;

class InlineContentPainter {
public:
    InlineContentPainter(PaintInfo&, const LayoutPoint& paintOffset, const RenderInline* inlineBoxWithLayer, const InlineContent&, const RenderBlockFlow& root);

    void paint();

private:
    void paintDisplayBox(const InlineDisplay::Box&);
    void paintEllipsis(size_t lineIndex);
    LayoutPoint flippedContentOffsetIfNeeded(const RenderBox&) const;
    const RenderBlock& root() const;

    PaintInfo& m_paintInfo;
    const LayoutPoint m_paintOffset;
    LayoutRect m_damageRect;
    const RenderInline* m_inlineBoxWithLayer { nullptr };
    const InlineContent& m_inlineContent;
    const RenderBlockFlow& m_root;
    SingleThreadWeakListHashSet<RenderInline> m_outlineObjects;
};

class LayerPaintScope {
public:
    LayerPaintScope(const RenderInline* inlineBoxWithLayer);
    bool includes(const InlineDisplay::Box&);

private:
    const Layout::ElementBox* const m_inlineBoxWithLayer;
    const Layout::ElementBox* m_currentExcludedInlineBox { nullptr };
};

}
}

