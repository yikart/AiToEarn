/*
 * Copyright (C) 2004 Zack Rusin <zack@kde.org>
 * Copyright (C) 2004-2019 Apple Inc. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */

#pragma once

#include "CSSStyleDeclaration.h"
#include "ComputedStyleExtractor.h"
#include "PseudoElementIdentifier.h"
#include "RenderStyleConstants.h"
#include <wtf/FixedVector.h>
#include <wtf/RefPtr.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class Element;
class MutableStyleProperties;

class CSSComputedStyleDeclaration final : public CSSStyleDeclaration, public RefCounted<CSSComputedStyleDeclaration> {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED_EXPORT(CSSComputedStyleDeclaration, WEBCORE_EXPORT);
public:
    void ref() const final { RefCounted::ref(); }
    void deref() const final { RefCounted::deref(); }

    enum class AllowVisited : bool { No, Yes };
    WEBCORE_EXPORT static Ref<CSSComputedStyleDeclaration> create(Element&, AllowVisited);
    static Ref<CSSComputedStyleDeclaration> create(Element&, const std::optional<Style::PseudoElementIdentifier>&);
    static Ref<CSSComputedStyleDeclaration> createEmpty(Element&);

    WEBCORE_EXPORT virtual ~CSSComputedStyleDeclaration();

    String getPropertyValue(CSSPropertyID) const;

private:
    enum class IsEmpty : bool { No, Yes };
    CSSComputedStyleDeclaration(Element&, AllowVisited);
    CSSComputedStyleDeclaration(Element&, IsEmpty);
    CSSComputedStyleDeclaration(Element&, const std::optional<Style::PseudoElementIdentifier>&);

    // CSSOM functions. Don't make these public.
    CSSRule* parentRule() const final;
    CSSRule* cssRules() const final;
    unsigned length() const final;
    String item(unsigned index) const final;
    RefPtr<DeprecatedCSSOMValue> getPropertyCSSValue(const String& propertyName) final;
    String getPropertyValue(const String& propertyName) final;
    String getPropertyPriority(const String& propertyName) final;
    String getPropertyShorthand(const String& propertyName) final;
    bool isPropertyImplicit(const String& propertyName) final;
    ExceptionOr<void> setProperty(const String& propertyName, const String& value, const String& priority) final;
    ExceptionOr<String> removeProperty(const String& propertyName) final;
    String cssText() const final;
    ExceptionOr<void> setCssText(const String&) final;
    String getPropertyValueInternal(CSSPropertyID) final;
    ExceptionOr<void> setPropertyInternal(CSSPropertyID, const String& value, IsImportant) final;
    Ref<MutableStyleProperties> copyProperties() const final;

    RefPtr<CSSValue> getPropertyCSSValue(CSSPropertyID, ComputedStyleExtractor::UpdateLayout = ComputedStyleExtractor::UpdateLayout::Yes) const;

    const Settings* settings() const final;
    const FixedVector<CSSPropertyID>& exposedComputedCSSPropertyIDs() const;

    mutable Ref<Element> m_element;
    std::optional<Style::PseudoElementIdentifier> m_pseudoElementIdentifier { std::nullopt };
    bool m_isEmpty { false };
    bool m_allowVisitedStyle { false };
};

} // namespace WebCore
