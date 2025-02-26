/*
 * Copyright (C) 1999 Lars Knoll (knoll@kde.org)
 *           (C) 1999 Antti Koivisto (koivisto@kde.org)
 *           (C) 2001 Peter Kelly (pmk@post.com)
 *           (C) 2001 Dirk Mueller (mueller@kde.org)
 * Copyright (C) 2003, 2004, 2005, 2006, 2007, 2008, 2009 Apple Inc. All rights reserved.
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

#include "Node.h"
#include "QualifiedName.h"

namespace WebCore {

class Attribute;
class CSSStyleDeclaration;
class MutableStyleProperties;

class Attr final : public Node {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(Attr);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(Attr);
public:
    static Ref<Attr> create(Element&, const QualifiedName&);
    static Ref<Attr> create(Document&, const QualifiedName&, const AtomString& value);
    virtual ~Attr();

    String name() const { return qualifiedName().toString(); }
    bool specified() const { return true; }
    Element* ownerElement() const { return m_element.get(); }

    WEBCORE_EXPORT AtomString value() const;
    WEBCORE_EXPORT ExceptionOr<void> setValue(const AtomString&);

    const QualifiedName& qualifiedName() const { return m_name; }

    WEBCORE_EXPORT CSSStyleDeclaration* style();

    void attachToElement(Element&);
    void detachFromElementWithValue(const AtomString&);

    const AtomString& namespaceURI() const final { return m_name.namespaceURI(); }
    const AtomString& localName() const final { return m_name.localName(); }
    const AtomString& prefix() const final { return m_name.prefix(); }

private:
    Attr(Element&, const QualifiedName&);
    Attr(Document&, const QualifiedName&, const AtomString& value);

    String nodeName() const final { return name(); }

    String nodeValue() const final { return value(); }
    ExceptionOr<void> setNodeValue(const String&) final;

    ExceptionOr<void> setPrefix(const AtomString&) final;

    Ref<Node> cloneNodeInternal(TreeScope&, CloningOperation) final;

    bool isAttributeNode() const final { return true; }

    void parentOrShadowHostNode() const = delete; // Call parentNode() instead.

    // Attr wraps either an element/name, or a name/value pair (when it's a standalone Node.)
    // Note that m_name is always set, but m_element/m_standaloneValue may be null.
    WeakPtr<Element, WeakPtrImplWithEventTargetData> m_element;
    QualifiedName m_name;
    AtomString m_standaloneValue;

    RefPtr<MutableStyleProperties> m_style;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::Attr)
    static bool isType(const WebCore::Node& node) { return node.isAttributeNode(); }
SPECIALIZE_TYPE_TRAITS_END()
