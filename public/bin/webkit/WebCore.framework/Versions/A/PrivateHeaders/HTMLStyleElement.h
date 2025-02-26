/*
 * Copyright (C) 1999 Lars Knoll (knoll@kde.org)
 *           (C) 1999 Antti Koivisto (koivisto@kde.org)
 * Copyright (C) 2003, 2010, 2013 Apple Inc. ALl rights reserved.
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
#include "InlineStyleSheetOwner.h"

namespace WebCore {

class HTMLStyleElement;
class Page;
class StyleSheet;

template<typename T, typename Counter> class EventSender;

using StyleEventSender = EventSender<HTMLStyleElement, WeakPtrImplWithEventTargetData>;

class HTMLStyleElement final : public HTMLElement {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(HTMLStyleElement);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(HTMLStyleElement);
public:
    static Ref<HTMLStyleElement> create(Document&);
    static Ref<HTMLStyleElement> create(const QualifiedName&, Document&, bool createdByParser);
    virtual ~HTMLStyleElement();

    CSSStyleSheet* sheet() const { return m_styleSheetOwner.sheet(); }

    WEBCORE_EXPORT bool disabled() const;
    WEBCORE_EXPORT void setDisabled(bool);

    void dispatchPendingEvent(StyleEventSender*, const AtomString& eventType);
    static void dispatchPendingLoadEvents(Page*);

    void finishParsingChildren() final;

    WEBCORE_EXPORT DOMTokenList& blocking();

private:
    HTMLStyleElement(const QualifiedName&, Document&, bool createdByParser);

    void attributeChanged(const QualifiedName&, const AtomString& oldValue, const AtomString& newValue, AttributeModificationReason) final;
    InsertedIntoAncestorResult insertedIntoAncestor(InsertionType, ContainerNode&) final;
    void removedFromAncestor(RemovalType, ContainerNode&) final;
    void childrenChanged(const ChildChange&) final;

    bool isLoading() const { return m_styleSheetOwner.isLoading(); }
    bool sheetLoaded() final { return m_styleSheetOwner.sheetLoaded(*this); }
    void notifyLoadedSheetAndAllCriticalSubresources(bool errorOccurred) final;
    void startLoadingDynamicSheet() final { m_styleSheetOwner.startLoadingDynamicSheet(*this); }

    void addSubresourceAttributeURLs(ListHashSet<URL>&) const final;

    InlineStyleSheetOwner m_styleSheetOwner;
    std::unique_ptr<DOMTokenList> m_blockingList;
    bool m_loadedSheet { false };
};

} //namespace
