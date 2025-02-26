/*
 * Copyright (C) 2008, 2014 Apple Inc. All Rights Reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "ConcurrentJSLock.h"
#include "RuntimeType.h"
#include "StructureSet.h"
#include <wtf/HashSet.h>
#include <wtf/JSONValues.h>
#include <wtf/RefCounted.h>
#include <wtf/ThreadSafeRefCounted.h>
#include <wtf/text/WTFString.h>
#include <wtf/Vector.h>

namespace Inspector {
namespace Protocol  {

namespace Runtime {
class StructureDescription;
class TypeSet;
}

}
}

namespace JSC {

class StructureShape : public RefCounted<StructureShape> {
    friend class TypeSet;

public:
    StructureShape();

    static Ref<StructureShape> create() { return adoptRef(*new StructureShape); }
    String propertyHash();
    void markAsFinal();
    void addProperty(UniquedStringImpl&);
    String stringRepresentation();
    String toJSONString() const;
    Ref<Inspector::Protocol::Runtime::StructureDescription> inspectorRepresentation();
    void setConstructorName(String name) { m_constructorName = (name.isEmpty() ? "Object"_s : name); }
    String constructorName() { return m_constructorName; }
    void setProto(Ref<StructureShape>&& shape) { m_proto = WTFMove(shape); }
    void enterDictionaryMode();

private:
    static String leastCommonAncestor(const Vector<Ref<StructureShape>>&);
    static Ref<StructureShape> merge(Ref<StructureShape>&&, Ref<StructureShape>&&);
    bool hasSamePrototypeChain(const StructureShape&);

    bool m_final;
    bool m_isInDictionaryMode;
    HashSet<RefPtr<UniquedStringImpl>, IdentifierRepHash> m_fields;
    HashSet<RefPtr<UniquedStringImpl>, IdentifierRepHash> m_optionalFields;
    RefPtr<StructureShape> m_proto;
    std::unique_ptr<String> m_propertyHash;
    String m_constructorName;
};

class TypeSet : public ThreadSafeRefCounted<TypeSet> {

public:
    static Ref<TypeSet> create() { return adoptRef(*new TypeSet); }
    TypeSet();
    void addTypeInformation(RuntimeType, RefPtr<StructureShape>&&, Structure*, bool sawPolyProtoStructure);
    void invalidateCache(VM&);
    String dumpTypes() const;
    String displayName() const;
    Ref<JSON::ArrayOf<Inspector::Protocol::Runtime::StructureDescription>> allStructureRepresentations() const;
    String toJSONString() const;
    bool isOverflown() const { return m_isOverflown; }
    String leastCommonAncestor() const;
    Ref<Inspector::Protocol::Runtime::TypeSet> inspectorTypeSet() const;
    bool isEmpty() const { return m_seenTypes == TypeNothing; }
    bool doesTypeConformTo(RuntimeTypeMask test) const;
    RuntimeTypeMask seenTypes() const { return m_seenTypes; }
    StructureSet structureSet(const ConcurrentJSLocker&) const { return m_structureSet; }

    ConcurrentJSLock m_lock;
private:
    bool m_isOverflown;
    RuntimeTypeMask m_seenTypes;
    Vector<Ref<StructureShape>> m_structureHistory;
    StructureSet m_structureSet;
};

} // namespace JSC
