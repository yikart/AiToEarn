/*
 * Copyright (C) 2005-2017 Apple Inc. All rights reserved.
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

#include <wtf/HashTraits.h>
#include <wtf/Hasher.h>
#include <wtf/NeverDestroyed.h>
#include <wtf/text/AtomString.h>
#include <wtf/text/AtomStringHash.h>
#include <wtf/text/MakeString.h>

namespace WebCore {

enum class Namespace : uint8_t;
enum class NodeName : uint16_t;

struct QualifiedNameComponents {
    AtomStringImpl* m_prefix;
    AtomStringImpl* m_localName;
    AtomStringImpl* m_namespaceURI;
};

inline void add(Hasher& hasher, const QualifiedNameComponents& components)
{
    add(hasher, components.m_prefix, components.m_localName, components.m_namespaceURI);
}

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(QualifiedName);
DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(QualifiedNameQualifiedNameImpl);

class QualifiedName {
    WTF_MAKE_STRUCT_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(QualifiedName);
public:
    class QualifiedNameImpl : public RefCounted<QualifiedNameImpl> {
        WTF_MAKE_STRUCT_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(QualifiedNameQualifiedNameImpl);
    public:
        static Ref<QualifiedNameImpl> create(const AtomString& prefix, const AtomString& localName, const AtomString& namespaceURI)
        {
            return adoptRef(*new QualifiedNameImpl(prefix, localName, namespaceURI));
        }

        WEBCORE_EXPORT ~QualifiedNameImpl();

        unsigned computeHash() const;

        mutable unsigned m_existingHash { 0 };
        Namespace m_namespace;
        NodeName m_nodeName;
        const AtomString m_prefix;
        const AtomString m_localName;
        const AtomString m_namespaceURI;
        AtomString m_localNameLower;
        mutable AtomString m_localNameUpper;

        static constexpr ptrdiff_t namespaceMemoryOffset() { return OBJECT_OFFSETOF(QualifiedNameImpl, m_namespace); }
        static constexpr ptrdiff_t nodeNameMemoryOffset() { return OBJECT_OFFSETOF(QualifiedNameImpl, m_nodeName); }
        static constexpr ptrdiff_t localNameMemoryOffset() { return OBJECT_OFFSETOF(QualifiedNameImpl, m_localName); }
        static constexpr ptrdiff_t namespaceURIMemoryOffset() { return OBJECT_OFFSETOF(QualifiedNameImpl, m_namespaceURI); }

    private:
        friend class QualifiedName;

        QualifiedNameImpl(const AtomString& prefix, const AtomString& localName, const AtomString& namespaceURI);
    };

    WEBCORE_EXPORT QualifiedName(const AtomString& prefix, const AtomString& localName, const AtomString& namespaceURI);
    WEBCORE_EXPORT QualifiedName(const AtomString& prefix, const AtomString& localName, const AtomString& namespaceURI, Namespace, NodeName);
    QualifiedName(QualifiedNameImpl& impl) : m_impl(&impl) { }
    explicit QualifiedName(WTF::HashTableDeletedValueType) : m_impl(WTF::HashTableDeletedValue) { }
    bool isHashTableDeletedValue() const { return m_impl.isHashTableDeletedValue(); }

    friend bool operator==(const QualifiedName&, const QualifiedName&) = default;

    bool matches(const QualifiedName& other) const { return m_impl == other.m_impl || (localName() == other.localName() && namespaceURI() == other.namespaceURI()); }

    bool hasPrefix() const { return !m_impl->m_prefix.isNull(); }
    void setPrefix(const AtomString& prefix) { *this = QualifiedName(prefix, localName(), namespaceURI()); }

    const AtomString& prefix() const { return m_impl->m_prefix; }
    const AtomString& localName() const { return m_impl->m_localName; }
    const AtomString& namespaceURI() const { return m_impl->m_namespaceURI; }
    const AtomString& localNameLowercase() const { return m_impl->m_localNameLower; }
    const AtomString& localNameUppercase() const;

    NodeName nodeName() const { return m_impl->m_nodeName; }
    Namespace nodeNamespace() const { return m_impl->m_namespace; }

    String toString() const;
    AtomString toAtomString() const;

    QualifiedNameImpl* impl() const { return m_impl.get(); }
#if ENABLE(JIT)
    static constexpr ptrdiff_t implMemoryOffset() { return OBJECT_OFFSETOF(QualifiedName, m_impl); }
#endif
    
    // Init routine for globals
    WEBCORE_EXPORT static void init();

private:
    static QualifiedNameImpl* hashTableDeletedValue() { return RefPtr<QualifiedNameImpl>::PtrTraits::hashTableDeletedValue(); }
    
    RefPtr<QualifiedNameImpl> m_impl;
};

inline void add(Hasher& hasher, const QualifiedName::QualifiedNameImpl& impl)
{
    add(hasher, impl.m_prefix, impl.m_localName, impl.m_namespaceURI);
}

inline void add(Hasher& hasher, const QualifiedName& name)
{
    add(hasher, std::bit_cast<uintptr_t>(name.impl()));
}

extern LazyNeverDestroyed<const QualifiedName> anyName;
inline const QualifiedName& anyQName() { return anyName; }

extern LazyNeverDestroyed<const QualifiedName> nullName;
inline const QualifiedName& nullQName() { return nullName; }

inline bool operator==(const AtomString& a, const QualifiedName& q) { return a == q.localName(); }
inline bool operator==(const QualifiedName& q, const AtomString& a) { return a == q.localName(); }

struct QualifiedNameHash {
    static unsigned hash(const QualifiedName& name) { return hash(name.impl()); }

    static unsigned hash(const QualifiedName::QualifiedNameImpl* name) 
    {
        if (!name->m_existingHash)
            name->m_existingHash = name->computeHash();
        return name->m_existingHash;
    }

    static bool equal(const QualifiedName& a, const QualifiedName& b) { return a == b; }
    static bool equal(const QualifiedName::QualifiedNameImpl* a, const QualifiedName::QualifiedNameImpl* b) { return a == b; }

    static constexpr bool safeToCompareToEmptyOrDeleted = false;
    static constexpr bool hasHashInValue = true;
};

inline String QualifiedName::toString() const
{
    if (!hasPrefix())
        return localName();

    return makeString(prefix().string(), ':', localName().string());
}

inline AtomString QualifiedName::toAtomString() const
{
    if (!hasPrefix())
        return localName();

    return makeAtomString(prefix(), ':', localName());
}

} // namespace WebCore

namespace WTF {
    
    template<typename T> struct DefaultHash;

    template<> struct DefaultHash<WebCore::QualifiedName> : WebCore::QualifiedNameHash { };
    
    template<> struct HashTraits<WebCore::QualifiedName> : SimpleClassHashTraits<WebCore::QualifiedName> {
        static const bool emptyValueIsZero = false;
        static WebCore::QualifiedName emptyValue() { return WebCore::nullQName(); }
    };

} // namespace WTF
