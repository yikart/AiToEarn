/*
 * Copyright (C) 1999 Lars Knoll (knoll@kde.org)
 *           (C) 1999 Antti Koivisto (koivisto@kde.org)
 *           (C) 2000 Simon Hausmann <hausmann@kde.org>
 * Copyright (C) 2004, 2006, 2009 Apple Inc. All rights reserved.
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
 *
 */

#pragma once

#include "HTMLFrameElementBase.h"

namespace WebCore {

class RenderFrame;

class HTMLFrameElement final : public HTMLFrameElementBase {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(HTMLFrameElement);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(HTMLFrameElement);
public:
    static Ref<HTMLFrameElement> create(const QualifiedName&, Document&);

    bool hasFrameBorder() const { return m_frameBorder; }
    bool noResize() const;

    RenderFrame* renderer() const;

private:
    HTMLFrameElement(const QualifiedName&, Document&);

    void didAttachRenderers() final;
    bool rendererIsNeeded(const RenderStyle&) final;
    RenderPtr<RenderElement> createElementRenderer(RenderStyle&&, const RenderTreePosition&) final;
    bool isReplaced(const RenderStyle&) const final { return true; }
    int defaultTabIndex() const final;
    void attributeChanged(const QualifiedName&, const AtomString& oldValue, const AtomString& newValue, AttributeModificationReason) final;

    bool m_frameBorder { true };
    bool m_frameBorderSet { false };
};

} // namespace WebCore
