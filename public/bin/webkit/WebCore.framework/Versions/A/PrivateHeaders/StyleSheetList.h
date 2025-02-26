/*
 * (C) 1999-2003 Lars Knoll (knoll@kde.org)
 * Copyright (C) 2004, 2006, 2007 Apple Inc. All rights reserved.
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

#include <wtf/Forward.h>
#include <wtf/RefCounted.h>
#include <wtf/Vector.h>
#include <wtf/WeakPtr.h>

namespace WebCore {

class Document;
class HTMLStyleElement;
class Node;
class ShadowRoot;
class StyleSheet;
class CSSStyleSheet;
class WeakPtrImplWithEventTargetData;

class StyleSheetList final : public RefCounted<StyleSheetList> {
public:
    static Ref<StyleSheetList> create(Document& document) { return adoptRef(*new StyleSheetList(document)); }
    static Ref<StyleSheetList> create(ShadowRoot& shadowRoot) { return adoptRef(*new StyleSheetList(shadowRoot)); }
    WEBCORE_EXPORT ~StyleSheetList();

    bool isSupportedPropertyIndex(unsigned index) const { return index < length(); }
    WEBCORE_EXPORT unsigned length() const;
    WEBCORE_EXPORT StyleSheet* item(unsigned index);

    CSSStyleSheet* namedItem(const AtomString&) const;
    bool isSupportedPropertyName(const AtomString&) const;
    Vector<AtomString> supportedPropertyNames();

    Node* ownerNode() const;

    void detach();

private:
    StyleSheetList(Document&);
    StyleSheetList(ShadowRoot&);
    const Vector<RefPtr<StyleSheet>>& styleSheets() const;

    WeakPtr<Document, WeakPtrImplWithEventTargetData> m_document;
    ShadowRoot* m_shadowRoot { nullptr };
    Vector<RefPtr<StyleSheet>> m_detachedStyleSheets;
};

} // namespace WebCore
