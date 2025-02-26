/*
 * Copyright (C) 1999 Lars Knoll (knoll@kde.org)
 *           (C) 1999 Antti Koivisto (koivisto@kde.org)
 * Copyright (C) 2003-2017 Inc. All rights reserved.
 * Copyright (C) 2008 Nikolas Zimmermann <zimmermann@kde.org>
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

#include "DOMTokenList.h"
#include "HTMLElement.h"
#include "ScriptElement.h"

namespace WebCore {

class TrustedScript;
class TrustedScriptURL;

enum class RequestPriority : uint8_t;

class HTMLScriptElement final : public HTMLElement, public ScriptElement {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(HTMLScriptElement);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(HTMLScriptElement);
public:
    static Ref<HTMLScriptElement> create(const QualifiedName&, Document&, bool wasInsertedByParser, bool alreadyStarted = false);

    String text() const { return scriptContent(); }
    WEBCORE_EXPORT void setText(String&&);
    ExceptionOr<void> setText(std::variant<RefPtr<TrustedScript>, String>&&);

    using Node::setTextContent;
    ExceptionOr<void> setTextContent(std::optional<std::variant<RefPtr<TrustedScript>, String>>&&);

    using HTMLElement::setInnerText;
    ExceptionOr<void> setInnerText(std::variant<RefPtr<TrustedScript>, String>&&);

    String src() const;
    ExceptionOr<void> setSrc(std::variant<RefPtr<TrustedScriptURL>, String>&&);

    WEBCORE_EXPORT void setAsync(bool);
    WEBCORE_EXPORT bool async() const;

    WEBCORE_EXPORT void setCrossOrigin(const AtomString&);
    WEBCORE_EXPORT String crossOrigin() const;

    void setReferrerPolicyForBindings(const AtomString&);
    String referrerPolicyForBindings() const;
    ReferrerPolicy referrerPolicy() const final;

    using HTMLElement::ref;
    using HTMLElement::deref;

    static bool supports(StringView type) { return type == "classic"_s || type == "module"_s || type == "importmap"_s; }

    void setFetchPriorityForBindings(const AtomString&);
    String fetchPriorityForBindings() const;
    RequestPriority fetchPriorityHint() const override;

    WEBCORE_EXPORT DOMTokenList& blocking();

private:
    HTMLScriptElement(const QualifiedName&, Document&, bool wasInsertedByParser, bool alreadyStarted);

    void attributeChanged(const QualifiedName&, const AtomString& oldValue, const AtomString& newValue, AttributeModificationReason) final;
    InsertedIntoAncestorResult insertedIntoAncestor(InsertionType, ContainerNode&) final;
    void didFinishInsertingNode() final;
    void childrenChanged(const ChildChange&) final;
    void finishParsingChildren() final;
    void removedFromAncestor(RemovalType, ContainerNode&) final;

    void potentiallyBlockRendering() final;
    void unblockRendering() final;
    bool isImplicitlyPotentiallyRenderBlocking() const;

    ExceptionOr<void> setTextContent(ExceptionOr<String>);

    bool isURLAttribute(const Attribute&) const final;

    void addSubresourceAttributeURLs(ListHashSet<URL>&) const final;

    String sourceAttributeValue() const final;
    AtomString charsetAttributeValue() const final;
    String typeAttributeValue() const final;
    String languageAttributeValue() const final;
    bool hasAsyncAttribute() const final;
    bool hasDeferAttribute() const final;
    bool hasNoModuleAttribute() const final;
    bool hasSourceAttribute() const final;

    void dispatchLoadEvent() final;

    bool isScriptPreventedByAttributes() const final;

    Ref<Element> cloneElementWithoutAttributesAndChildren(TreeScope&) final;

    std::unique_ptr<DOMTokenList> m_blockingList;
    bool m_isRenderBlocking { false };
};

} //namespace
