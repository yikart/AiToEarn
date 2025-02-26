/*
 * Copyright (C) 1999 Lars Knoll (knoll@kde.org)
 *           (C) 1999 Antti Koivisto (koivisto@kde.org)
 * Copyright (C) 2003, 2010 Apple Inc. All rights reserved.
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

#include "Color.h"
#include "HTMLElement.h"
#include "MediaQuery.h"

namespace WebCore {

class HTMLMetaElement final : public HTMLElement {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(HTMLMetaElement);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(HTMLMetaElement);
public:
    static Ref<HTMLMetaElement> create(Document&);
    static Ref<HTMLMetaElement> create(const QualifiedName&, Document&);

    const AtomString& content() const;
    const AtomString& httpEquiv() const;
    const AtomString& name() const;

    bool mediaAttributeMatches();

    const Color& contentColor();

private:
    HTMLMetaElement(const QualifiedName&, Document&);

    void attributeChanged(const QualifiedName&, const AtomString& oldValue, const AtomString& newValue, AttributeModificationReason = AttributeModificationReason::Directly) final;
    InsertedIntoAncestorResult insertedIntoAncestor(InsertionType, ContainerNode&) final;
    void didFinishInsertingNode();
    void removedFromAncestor(RemovalType, ContainerNode&) final;

    void process(const AtomString& oldValue = nullAtom());

    std::optional<MQ::MediaQueryList> m_mediaQueryList;

    std::optional<Color> m_contentColor;
};

} // namespace WebCore
