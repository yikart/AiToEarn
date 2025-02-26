/*
 * Copyright (C) 1999 Lars Knoll (knoll@kde.org)
 *           (C) 1999 Antti Koivisto (koivisto@kde.org)
 *           (C) 2000 Simon Hausmann <hausmann@kde.org>
 * Copyright (C) 2004, 2006, 2009, 2010 Apple Inc. All rights reserved.
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

#include "HTMLElement.h"
#include <wtf/UniqueArray.h>

namespace WebCore {

class WindowProxy;

class HTMLFrameSetElement final : public HTMLElement {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(HTMLFrameSetElement);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(HTMLFrameSetElement);
public:
    static Ref<HTMLFrameSetElement> create(const QualifiedName&, Document&);

    bool hasFrameBorder() const { return m_frameborder; }
    bool noResize() const { return m_noresize; }

    int totalRows() const { return m_totalRows; }
    int totalCols() const { return m_totalCols; }
    int border() const { return hasFrameBorder() ? m_border : 0; }

    bool hasBorderColor() const { return m_borderColorSet; }

    std::span<const Length> rowLengths() const { return m_rowLengths ? unsafeMakeSpan(m_rowLengths.get(), m_totalRows) : std::span<const Length> { }; }
    std::span<const Length> colLengths() const { return m_colLengths ? unsafeMakeSpan(m_colLengths.get(), m_totalCols) : std::span<const Length> { }; }

    static RefPtr<HTMLFrameSetElement> findContaining(Element* descendant);
    
    Vector<AtomString> supportedPropertyNames() const;
    WindowProxy* namedItem(const AtomString&);
    bool isSupportedPropertyName(const AtomString&);

private:
    HTMLFrameSetElement(const QualifiedName&, Document&);

    void attributeChanged(const QualifiedName&, const AtomString& oldValue, const AtomString& newValue, AttributeModificationReason) final;
    bool hasPresentationalHintsForAttribute(const QualifiedName&) const final;
    void collectPresentationalHintsForAttribute(const QualifiedName&, const AtomString&, MutableStyleProperties&) final;

    void willAttachRenderers() final;
    RenderPtr<RenderElement> createElementRenderer(RenderStyle&&, const RenderTreePosition&) final;
    
    void defaultEventHandler(Event&) final;

    void willRecalcStyle(Style::Change) final;

    InsertedIntoAncestorResult insertedIntoAncestor(InsertionType, ContainerNode&) final;
    void removedFromAncestor(RemovalType, ContainerNode&) final;

    UniqueArray<Length> m_rowLengths;
    UniqueArray<Length> m_colLengths;

    int m_totalRows;
    int m_totalCols;
    
    int m_border;
    bool m_borderSet;
    
    bool m_borderColorSet;

    bool m_frameborder;
    bool m_frameborderSet;
    bool m_noresize;
};

} // namespace WebCore
