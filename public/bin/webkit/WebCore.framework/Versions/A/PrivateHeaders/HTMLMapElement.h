/*
 * Copyright (C) 1999 Lars Knoll (knoll@kde.org)
 *           (C) 1999 Antti Koivisto (koivisto@kde.org)
 * Copyright (C) 2004, 2010 Apple Inc. All rights reserved.
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

namespace WebCore {

class HitTestResult;
class HTMLImageElement;
    
class HTMLMapElement final : public HTMLElement {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(HTMLMapElement);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(HTMLMapElement);
public:
    static Ref<HTMLMapElement> create(Document&);
    static Ref<HTMLMapElement> create(const QualifiedName&, Document&);
    virtual ~HTMLMapElement();

    const AtomString& getName() const { return m_name; }

    bool mapMouseEvent(LayoutPoint location, const LayoutSize&, HitTestResult&);
    
    RefPtr<HTMLImageElement> imageElement();
    WEBCORE_EXPORT Ref<HTMLCollection> areas();

private:
    HTMLMapElement(const QualifiedName&, Document&);

    void attributeChanged(const QualifiedName&, const AtomString& oldValue, const AtomString& newValue, AttributeModificationReason) final;

    InsertedIntoAncestorResult insertedIntoAncestor(InsertionType, ContainerNode&) final;
    void removedFromAncestor(RemovalType, ContainerNode&) final;

    AtomString m_name;
};

} // namespaces
