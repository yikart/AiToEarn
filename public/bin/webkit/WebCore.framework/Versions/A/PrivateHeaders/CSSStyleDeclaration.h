/*
 * (C) 1999-2003 Lars Knoll (knoll@kde.org)
 * Copyright (C) 2004, 2005, 2006, 2008, 2012 Apple Inc. All rights reserved.
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

#include "CSSProperty.h"
#include "CSSPropertyNames.h"
#include "ExceptionOr.h"
#include "ScriptWrappable.h"
#include <wtf/AbstractRefCountedAndCanMakeWeakPtr.h>
#include <wtf/CheckedRef.h>

namespace WebCore {

class CSSRule;
class CSSStyleSheet;
class CSSValue;
class DeprecatedCSSOMValue;
class MutableStyleProperties;
class StyleProperties;
class StyledElement;

class CSSStyleDeclaration : public ScriptWrappable, public AbstractRefCountedAndCanMakeSingleThreadWeakPtr<CSSStyleDeclaration> {
    WTF_MAKE_NONCOPYABLE(CSSStyleDeclaration);
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(CSSStyleDeclaration);
public:
    virtual ~CSSStyleDeclaration() = default;

    virtual StyledElement* parentElement() const { return nullptr; }
    virtual CSSRule* parentRule() const = 0;
    virtual CSSRule* cssRules() const = 0;
    virtual String cssText() const = 0;
    virtual ExceptionOr<void> setCssText(const String&) = 0;
    virtual unsigned length() const = 0;
    virtual String item(unsigned index) const = 0;
    bool isSupportedPropertyIndex(unsigned index) const { return index < length(); }
    virtual RefPtr<DeprecatedCSSOMValue> getPropertyCSSValue(const String& propertyName) = 0;
    virtual String getPropertyValue(const String& propertyName) = 0;
    virtual String getPropertyPriority(const String& propertyName) = 0;
    virtual String getPropertyShorthand(const String& propertyName) = 0;
    virtual bool isPropertyImplicit(const String& propertyName) = 0;
    virtual ExceptionOr<void> setProperty(const String& propertyName, const String& value, const String& priority) = 0;
    virtual ExceptionOr<String> removeProperty(const String& propertyName) = 0;

    String cssFloat();
    ExceptionOr<void> setCssFloat(const String&);

    // CSSPropertyID versions of the CSSOM functions to support bindings and editing.
    // Use the non-virtual methods in the concrete subclasses when possible.
    virtual String getPropertyValueInternal(CSSPropertyID) = 0;
    virtual ExceptionOr<void> setPropertyInternal(CSSPropertyID, const String& value, IsImportant) = 0;

    virtual Ref<MutableStyleProperties> copyProperties() const = 0;

    virtual CSSStyleSheet* parentStyleSheet() const { return nullptr; }

    virtual const Settings* settings() const;

    // FIXME: It would be more efficient, by virtue of avoiding the text transformation and hash lookup currently
    // required in the implementation, if we could could smuggle the CSSPropertyID through the bindings, perhaps
    // by encoding it into the HashTableValue and then passing it together with the PropertyName.

    // Shared implementation for all properties that match https://drafts.csswg.org/cssom/#dom-cssstyledeclaration-camel_cased_attribute.
    String propertyValueForCamelCasedIDLAttribute(const AtomString&);
    ExceptionOr<void> setPropertyValueForCamelCasedIDLAttribute(const AtomString&, const String&);

    // Shared implementation for all properties that match https://drafts.csswg.org/cssom/#dom-cssstyledeclaration-webkit_cased_attribute.
    String propertyValueForWebKitCasedIDLAttribute(const AtomString&);
    ExceptionOr<void> setPropertyValueForWebKitCasedIDLAttribute(const AtomString&, const String&);

    // Shared implementation for all properties that match https://drafts.csswg.org/cssom/#dom-cssstyledeclaration-dashed_attribute.
    String propertyValueForDashedIDLAttribute(const AtomString&);
    ExceptionOr<void> setPropertyValueForDashedIDLAttribute(const AtomString&, const String&);

    // Shared implementation for all properties that match non-standard Epub-cased.
    String propertyValueForEpubCasedIDLAttribute(const AtomString&);
    ExceptionOr<void> setPropertyValueForEpubCasedIDLAttribute(const AtomString&, const String&);

    // FIXME: This needs to pass in a Settings& to work correctly.
    static CSSPropertyID getCSSPropertyIDFromJavaScriptPropertyName(const AtomString&);

protected:
    CSSStyleDeclaration() = default;
};

} // namespace WebCore
