/*
 * Copyright (C) 1999 Lars Knoll (knoll@kde.org)
 *           (C) 1999 Antti Koivisto (koivisto@kde.org)
 * Copyright (C) 2010-2017 Apple Inc. All rights reserved.
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

class HTMLOListElement final : public HTMLElement {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(HTMLOListElement);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(HTMLOListElement);
public:
    static Ref<HTMLOListElement> create(Document&);
    static Ref<HTMLOListElement> create(const QualifiedName&, Document&);

    int startForBindings() const { return m_start.value_or(1); }
    WEBCORE_EXPORT void setStartForBindings(int);

    // FIXME: The reason start() does not trigger layout is because it is called
    // from rendering code. This is unfortunately one of the few cases where the
    // render tree is mutated during layout.

    int start() const { return m_start ? m_start.value() : (m_isReversed ? itemCount() : 1); }
    bool isReversed() const { return m_isReversed; }
    void itemCountChanged() { m_itemCount = std::nullopt; }

private:
    HTMLOListElement(const QualifiedName&, Document&);
        
    WEBCORE_EXPORT unsigned itemCount() const;

    void attributeChanged(const QualifiedName&, const AtomString& oldValue, const AtomString& newValue, AttributeModificationReason) final;
    bool hasPresentationalHintsForAttribute(const QualifiedName&) const final;
    void collectPresentationalHintsForAttribute(const QualifiedName&, const AtomString&, MutableStyleProperties&) final;

    std::optional<int> m_start;
    mutable std::optional<unsigned> m_itemCount;
    bool m_isReversed { false };
};

} //namespace
