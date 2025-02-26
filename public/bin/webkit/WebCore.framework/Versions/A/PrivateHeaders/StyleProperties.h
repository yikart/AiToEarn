/**
 * (C) 1999-2003 Lars Knoll (knoll@kde.org)
 * Copyright (C) 2004-2023 Apple Inc. All rights reserved.
 * Copyright (C) 2013 Intel Corporation. All rights reserved.
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

namespace WebCore {

class CachedResource;
class Color;
class ImmutableStyleProperties;
class MutableStyleProperties;

enum CSSValueID : uint16_t;
enum CSSParserMode : uint8_t;

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(StyleProperties);
class StyleProperties : public RefCounted<StyleProperties> {
    WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(StyleProperties);
public:
    // Override RefCounted's deref() to ensure operator delete is called on
    // the appropriate subclass type.
    inline void deref() const;

    class PropertyReference {
    public:
        PropertyReference(const StylePropertyMetadata& metadata, const CSSValue* value)
            : m_metadata(metadata)
            , m_value(value)
        { }

        CSSPropertyID id() const { return static_cast<CSSPropertyID>(m_metadata.m_propertyID); }
        CSSPropertyID shorthandID() const { return m_metadata.shorthandID(); }

        bool isImportant() const { return m_metadata.m_important; }
        bool isInherited() const { return m_metadata.m_inherited; }
        bool isImplicit() const { return m_metadata.m_implicit; }

        String cssName() const;
        String cssText() const;

        const CSSValue* value() const { return m_value; }
        // FIXME: We should try to remove this mutable overload.
        CSSValue* value() { return const_cast<CSSValue*>(m_value); }

        // FIXME: Remove this.
        CSSProperty toCSSProperty() const { return CSSProperty(id(), const_cast<CSSValue*>(m_value), isImportant() ? IsImportant::Yes : IsImportant::No, m_metadata.m_isSetFromShorthand, m_metadata.m_indexInShorthandsVector, isImplicit()); }

    private:
        const StylePropertyMetadata& m_metadata;
        const CSSValue* m_value;
    };

    template<typename T>
    struct Iterator {
        using iterator_category = std::forward_iterator_tag;
        using value_type = PropertyReference;
        using difference_type = ptrdiff_t;
        using pointer = PropertyReference;
        using reference = PropertyReference;

        Iterator(const T& properties)
            : properties { properties }
        {
        }

        PropertyReference operator*() const { return properties.propertyAt(index); }
        Iterator& operator++() { ++index; return *this; }
        bool operator==(std::nullptr_t) const { return index >= properties.propertyCount(); }

    private:
        const T& properties;
        unsigned index { 0 };
    };

    inline unsigned propertyCount() const;
    inline bool isEmpty() const;
    inline PropertyReference propertyAt(unsigned) const;

    Iterator<StyleProperties> begin() const { return { *this }; }
    static constexpr std::nullptr_t end() { return nullptr; }
    inline unsigned size() const;

    WEBCORE_EXPORT RefPtr<CSSValue> getPropertyCSSValue(CSSPropertyID) const;
    WEBCORE_EXPORT String getPropertyValue(CSSPropertyID) const;

    WEBCORE_EXPORT std::optional<Color> propertyAsColor(CSSPropertyID) const;
    WEBCORE_EXPORT std::optional<CSSValueID> propertyAsValueID(CSSPropertyID) const;

    bool propertyIsImportant(CSSPropertyID) const;
    String getPropertyShorthand(CSSPropertyID) const;
    bool isPropertyImplicit(CSSPropertyID) const;

    RefPtr<CSSValue> getCustomPropertyCSSValue(const String& propertyName) const;
    String getCustomPropertyValue(const String& propertyName) const;
    bool customPropertyIsImportant(const String& propertyName) const;

    Ref<MutableStyleProperties> copyBlockProperties() const;

    CSSParserMode cssParserMode() const { return static_cast<CSSParserMode>(m_cssParserMode); }

    WEBCORE_EXPORT Ref<MutableStyleProperties> mutableCopy() const;
    Ref<ImmutableStyleProperties> immutableCopyIfNeeded() const;

    Ref<MutableStyleProperties> copyProperties(std::span<const CSSPropertyID>) const;
    
    String asText() const;
    AtomString asTextAtom() const;

    bool hasCSSOMWrapper() const;
    bool isMutable() const { return m_isMutable; }

    bool traverseSubresources(const Function<bool(const CachedResource&)>& handler) const;
    void setReplacementURLForSubresources(const UncheckedKeyHashMap<String, String>&);
    void clearReplacementURLForSubresources();
    bool mayDependOnBaseURL() const;

    static unsigned averageSizeInBytes();

#ifndef NDEBUG
    void showStyle();
#endif

    bool propertyMatches(CSSPropertyID, const CSSValue*) const;

    inline int findPropertyIndex(CSSPropertyID) const;
    inline int findCustomPropertyIndex(StringView propertyName) const;

protected:
    inline explicit StyleProperties(CSSParserMode);
    inline StyleProperties(CSSParserMode, unsigned immutableArraySize);

    unsigned m_cssParserMode : 3;
    mutable unsigned m_isMutable : 1 { true };
    unsigned m_arraySize : 28 { 0 };

private:
    StringBuilder asTextInternal() const;
    String serializeLonghandValue(CSSPropertyID) const;
    String serializeShorthandValue(CSSPropertyID) const;
};

String serializeLonghandValue(CSSPropertyID, const CSSValue&);
inline String serializeLonghandValue(CSSPropertyID, const CSSValue*);
inline CSSValueID longhandValueID(CSSPropertyID, const CSSValue&);
inline std::optional<CSSValueID> longhandValueID(CSSPropertyID, const CSSValue*);

} // namespace WebCore
