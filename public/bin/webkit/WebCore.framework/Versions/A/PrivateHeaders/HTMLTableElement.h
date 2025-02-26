/*
 * Copyright (C) 1997 Martin Jones (mjones@kde.org)
 *           (C) 1997 Torben Weis (weis@kde.org)
 *           (C) 1998 Waldo Bastian (bastian@kde.org)
 *           (C) 1999 Lars Knoll (knoll@kde.org)
 *           (C) 1999 Antti Koivisto (koivisto@kde.org)
 * Copyright (C) 2003, 2004, 2005, 2006, 2008 Apple Inc. All rights reserved.
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

class HTMLCollection;
class HTMLTableCaptionElement;
class HTMLTableRowsCollection;
class HTMLTableSectionElement;

class HTMLTableElement final : public HTMLElement {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(HTMLTableElement);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(HTMLTableElement);
public:
    static Ref<HTMLTableElement> create(Document&);
    static Ref<HTMLTableElement> create(const QualifiedName&, Document&);
    ~HTMLTableElement();

    WEBCORE_EXPORT RefPtr<HTMLTableCaptionElement> caption() const;
    WEBCORE_EXPORT ExceptionOr<void> setCaption(RefPtr<HTMLTableCaptionElement>&&);

    WEBCORE_EXPORT RefPtr<HTMLTableSectionElement> tHead() const;
    WEBCORE_EXPORT ExceptionOr<void> setTHead(RefPtr<HTMLTableSectionElement>&&);

    WEBCORE_EXPORT RefPtr<HTMLTableSectionElement> tFoot() const;
    WEBCORE_EXPORT ExceptionOr<void> setTFoot(RefPtr<HTMLTableSectionElement>&&);

    WEBCORE_EXPORT Ref<HTMLTableSectionElement> createTHead();
    WEBCORE_EXPORT void deleteTHead();
    WEBCORE_EXPORT Ref<HTMLTableSectionElement> createTFoot();
    WEBCORE_EXPORT void deleteTFoot();
    WEBCORE_EXPORT Ref<HTMLTableSectionElement> createTBody();
    WEBCORE_EXPORT Ref<HTMLTableCaptionElement> createCaption();
    WEBCORE_EXPORT void deleteCaption();
    WEBCORE_EXPORT ExceptionOr<Ref<HTMLElement>> insertRow(int index = -1);
    WEBCORE_EXPORT ExceptionOr<void> deleteRow(int index);

    WEBCORE_EXPORT Ref<HTMLCollection> rows();
    WEBCORE_EXPORT Ref<HTMLCollection> tBodies();

    const AtomString& rules() const;
    const AtomString& summary() const;

    const MutableStyleProperties* additionalCellStyle() const;
    const MutableStyleProperties* additionalGroupStyle(bool rows) const;

private:
    HTMLTableElement(const QualifiedName&, Document&);

    void attributeChanged(const QualifiedName&, const AtomString& oldValue, const AtomString& newValue, AttributeModificationReason) final;
    bool hasPresentationalHintsForAttribute(const QualifiedName&) const final;
    void collectPresentationalHintsForAttribute(const QualifiedName&, const AtomString&, MutableStyleProperties&) final;
    bool isURLAttribute(const Attribute&) const final;

    // Used to obtain either a solid or outset border decl and to deal with the frame and rules attributes.
    const MutableStyleProperties* additionalPresentationalHintStyle() const final;

    void addSubresourceAttributeURLs(ListHashSet<URL>&) const final;

    enum TableRules { UnsetRules, NoneRules, GroupsRules, RowsRules, ColsRules, AllRules };
    enum CellBorders { NoBorders, SolidBorders, InsetBorders, SolidBordersColsOnly, SolidBordersRowsOnly };

    CellBorders cellBorders() const;

    Ref<MutableStyleProperties> createSharedCellStyle() const;

    HTMLTableSectionElement* lastBody() const;

    bool m_borderAttr { false }; // Sets a precise border width and creates an outset border for the table and for its cells.
    bool m_frameAttr { false }; // Implies a thin border width if no border is set and then a certain set of solid/hidden borders based off the value.
    TableRules m_rulesAttr { UnsetRules }; // Implies a thin border width, a collapsing border model, and all borders on the table becoming set to hidden (if frame/border are present, to none otherwise).
    unsigned short m_padding { 1 };
    mutable RefPtr<const MutableStyleProperties> m_sharedCellStyle;
};

} //namespace
