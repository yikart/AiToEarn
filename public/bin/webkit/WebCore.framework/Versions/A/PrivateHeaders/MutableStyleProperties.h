/**
 * Copyright (C) 2023 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "StyleProperties.h"

namespace WebCore {

class PropertySetCSSStyleDeclaration;
class StyledElement;

struct CSSParserContext;

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(MutableStyleProperties);
class MutableStyleProperties final : public StyleProperties {
    WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(MutableStyleProperties);
public:
    inline void deref() const;

    static Ref<MutableStyleProperties> create(CSSParserMode);
    WEBCORE_EXPORT static Ref<MutableStyleProperties> create();
    static Ref<MutableStyleProperties> create(Vector<CSSProperty>&&);
    static Ref<MutableStyleProperties> createEmpty();

    WEBCORE_EXPORT ~MutableStyleProperties();

    Ref<ImmutableStyleProperties> immutableCopy() const;
    Ref<ImmutableStyleProperties> immutableDeduplicatedCopy() const;

    unsigned propertyCount() const { return m_propertyVector.size(); }
    bool isEmpty() const { return !propertyCount(); }
    PropertyReference propertyAt(unsigned index) const;

    Iterator<MutableStyleProperties> begin() const { return { *this }; }
    static constexpr std::nullptr_t end() { return nullptr; }
    unsigned size() const { return propertyCount(); }

    PropertySetCSSStyleDeclaration* cssStyleDeclaration();

    bool addParsedProperties(const ParsedPropertyVector&);
    bool addParsedProperty(const CSSProperty&);

    // These expand shorthand properties into multiple properties.
    bool setProperty(CSSPropertyID, const String& value, CSSParserContext, IsImportant = IsImportant::No, bool* didFailParsing = nullptr);
    bool setProperty(CSSPropertyID, const String& value, IsImportant = IsImportant::No, bool* didFailParsing = nullptr);
    void setProperty(CSSPropertyID, RefPtr<CSSValue>&&, IsImportant = IsImportant::No);

    // These do not. FIXME: This is too messy, we can do better.
    bool setProperty(CSSPropertyID, CSSValueID identifier, IsImportant = IsImportant::No);
    bool setProperty(const CSSProperty&, CSSProperty* slot = nullptr);

    bool removeProperty(CSSPropertyID, String* returnText = nullptr);
    bool removeProperties(std::span<const CSSPropertyID>);

    bool mergeAndOverrideOnConflict(const StyleProperties&);

    void clear();
    bool parseDeclaration(const String& styleDeclaration, CSSParserContext);

    WEBCORE_EXPORT CSSStyleDeclaration& ensureCSSStyleDeclaration();
    CSSStyleDeclaration& ensureInlineCSSStyleDeclaration(StyledElement& parentElement);

    int findPropertyIndex(CSSPropertyID) const;
    int findCustomPropertyIndex(StringView propertyName) const;

    // Methods for querying and altering CSS custom properties.
    bool setCustomProperty(const String& propertyName, const String& value, CSSParserContext, IsImportant = IsImportant::No);
    bool removeCustomProperty(const String& propertyName, String* returnText = nullptr);

private:
    explicit MutableStyleProperties(CSSParserMode);
    explicit MutableStyleProperties(const StyleProperties&);
    MutableStyleProperties(Vector<CSSProperty>&&);

    bool removeLonghandProperty(CSSPropertyID, String* returnText);
    bool removeShorthandProperty(CSSPropertyID, String* returnText);
    bool removePropertyAtIndex(int index, String* returnText);
    CSSProperty* findCSSPropertyWithID(CSSPropertyID);
    CSSProperty* findCustomCSSPropertyWithName(const String&);
    std::unique_ptr<PropertySetCSSStyleDeclaration> m_cssomWrapper;
    bool canUpdateInPlace(const CSSProperty&, CSSProperty* toReplace) const;

    friend class StyleProperties;

    Vector<CSSProperty, 4> m_propertyVector;
};

inline void MutableStyleProperties::deref() const
{
    if (derefBase())
        delete this;
}

inline MutableStyleProperties::PropertyReference MutableStyleProperties::propertyAt(unsigned index) const
{
    auto& property = m_propertyVector[index];
    return PropertyReference(property.metadata(), property.value());
}

}

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::MutableStyleProperties)
    static bool isType(const WebCore::StyleProperties& properties) { return properties.isMutable(); }
SPECIALIZE_TYPE_TRAITS_END()
