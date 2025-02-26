/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

#if ENABLE(ATTACHMENT_ELEMENT)

#include "HTMLAttachmentElement.h"
#include "RenderReplaced.h"

namespace WebCore {

class RenderAttachment final : public RenderReplaced {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(RenderAttachment);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(RenderAttachment);
public:
    RenderAttachment(HTMLAttachmentElement&, RenderStyle&&);
    virtual ~RenderAttachment();

    HTMLAttachmentElement& attachmentElement() const;

    void setShouldDrawBorder(bool drawBorder) { m_shouldDrawBorder = drawBorder; }
    bool shouldDrawBorder() const;

    void setHasShadowControls(bool hasShadowControls) { m_hasShadowControls = hasShadowControls; }
    bool hasShadowControls() const { return m_hasShadowControls; }
    bool isWideLayout() const { return m_isWideLayout; }
    bool hasShadowContent() const { return hasShadowControls() || isWideLayout(); }
    bool canHaveGeneratedChildren() const override { return hasShadowContent(); }
    bool canHaveChildren() const override { return hasShadowContent(); }

    bool paintWideLayoutAttachmentOnly(const PaintInfo&, const LayoutPoint& offset) const;

private:
    void element() const = delete;
    ASCIILiteral renderName() const override { return "RenderAttachment"_s; }
    LayoutSize layoutWideLayoutAttachmentOnly();
    void layoutShadowContent(const LayoutSize&) override;

    bool shouldDrawSelectionTint() const override { return isWideLayout(); }
    void paintReplaced(PaintInfo&, const LayoutPoint& offset) final;

    void layout() override;

    LayoutUnit baselinePosition(FontBaseline, bool, LineDirectionMode, LinePositionMode) const override;

    LayoutUnit m_minimumIntrinsicWidth;
    bool m_shouldDrawBorder { true };
    bool m_hasShadowControls { false };
    bool m_isWideLayout;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_RENDER_OBJECT(RenderAttachment, isRenderAttachment())

#endif // ENABLE(ATTACHMENT_ELEMENT)
