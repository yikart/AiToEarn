/*
 * Copyright (C) 2015-2022 Apple Inc. All rights reserved.
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

#include "GenericArguments.h"
#include "JSLexicalEnvironment.h"
#include "Watchpoint.h"

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

// This is an Arguments-class object that we create when you say "arguments" inside a function,
// and one or more of the arguments may be captured in the function's activation. The function
// will copy its formally declared arguments into the activation and then create this object. This
// object will store the overflow arguments, if there are any. This object will use the symbol
// table's ScopedArgumentsTable and the activation, or its overflow storage, to handle all indexed
// lookups.
class ScopedArguments final : public GenericArguments<ScopedArguments> {
private:
    ScopedArguments(VM&, Structure*, WriteBarrier<Unknown>* storage, unsigned totalLength, JSFunction* callee, ScopedArgumentsTable*, JSLexicalEnvironment*);
    using Base = GenericArguments<ScopedArguments>;

public:
    template<typename CellType, SubspaceAccess>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        static_assert(!CellType::needsDestruction);
        return &vm.scopedArgumentsSpace();
    }

    // Creates an arguments object but leaves it uninitialized. This is dangerous if we GC right
    // after allocation.
    static ScopedArguments* createUninitialized(VM&, Structure*, JSFunction* callee, ScopedArgumentsTable*, JSLexicalEnvironment*, unsigned totalLength);
    
    // Creates an arguments object and initializes everything to the empty value. Use this if you
    // cannot guarantee that you'll immediately initialize all of the elements.
    static ScopedArguments* create(VM&, Structure*, JSFunction* callee, ScopedArgumentsTable*, JSLexicalEnvironment*, unsigned totalLength);
    
    // Creates an arguments object by copying the arguments from the stack.
    static ScopedArguments* createByCopying(JSGlobalObject*, CallFrame*, ScopedArgumentsTable*, JSLexicalEnvironment*);
    
    // Creates an arguments object by copying the arguments from a well-defined stack location.
    static ScopedArguments* createByCopyingFrom(VM&, Structure*, Register* argumentsStart, unsigned totalLength, JSFunction* callee, ScopedArgumentsTable*, JSLexicalEnvironment*);

    DECLARE_VISIT_CHILDREN;

    uint32_t internalLength() const
    {
        return m_totalLength;
    }
    
    uint32_t length(JSGlobalObject* globalObject) const
    {
        VM& vm = getVM(globalObject);
        auto scope = DECLARE_THROW_SCOPE(vm);
        if (UNLIKELY(m_overrodeThings)) {
            auto value = get(globalObject, vm.propertyNames->length);
            RETURN_IF_EXCEPTION(scope, 0);
            RELEASE_AND_RETURN(scope, value.toUInt32(globalObject));
        }
        return internalLength();
    }
    
    bool isMappedArgument(uint32_t i) const
    {
        if (i >= m_totalLength)
            return false;
        unsigned namedLength = m_table->length();
        if (i < namedLength)
            return !!m_table->get(i);
        return !!storage()[i - namedLength].get();
    }

    bool isMappedArgumentInDFG(uint32_t i) const
    {
        return isMappedArgument(i);
    }
    
    JSValue getIndexQuickly(uint32_t i) const
    {
        ASSERT_WITH_SECURITY_IMPLICATION(isMappedArgument(i));
        unsigned namedLength = m_table->length();
        if (i < namedLength)
            return m_scope->variableAt(m_table->get(i)).get();
        return storage()[i - namedLength].get();
    }

    void setIndexQuickly(VM& vm, uint32_t i, JSValue value)
    {
        ASSERT_WITH_SECURITY_IMPLICATION(isMappedArgument(i));
        unsigned namedLength = m_table->length();
        if (i < namedLength) {
            m_scope->variableAt(m_table->get(i)).set(vm, m_scope.get(), value);

            auto* watchpointSet = m_table->getWatchpointSet(i);
            if (watchpointSet) {
#if ASSERT_ENABLED
                ASSERT(m_scope->symbolTable()->hasScopedWatchpointSet(watchpointSet));
#endif
                watchpointSet->touch(vm, "Write to ScopedArgument.");
            }
        } else
            storage()[i - namedLength].set(vm, this, value);
    }

    JSFunction* callee()
    {
        return m_callee.get();
    }

    bool overrodeThings() const { return m_overrodeThings; }
    void overrideThings(JSGlobalObject*);
    void overrideThingsIfNecessary(JSGlobalObject*);
    void unmapArgument(JSGlobalObject*, uint32_t index);
    
    void initModifiedArgumentsDescriptorIfNecessary(JSGlobalObject* globalObject)
    {
        GenericArguments<ScopedArguments>::initModifiedArgumentsDescriptorIfNecessary(globalObject, m_table->length());
    }

    void setModifiedArgumentDescriptor(JSGlobalObject* globalObject, unsigned index)
    {
        GenericArguments<ScopedArguments>::setModifiedArgumentDescriptor(globalObject, index, m_table->length());
    }

    bool isModifiedArgumentDescriptor(unsigned index)
    {
        return GenericArguments<ScopedArguments>::isModifiedArgumentDescriptor(index, m_table->length());
    }

    void copyToArguments(JSGlobalObject*, JSValue* firstElementDest, unsigned offset, unsigned length);

    JS_EXPORT_PRIVATE bool isIteratorProtocolFastAndNonObservable();

    DECLARE_INFO;
    
    static Structure* createStructure(VM&, JSGlobalObject*, JSValue prototype);
    
    static constexpr ptrdiff_t offsetOfOverrodeThings() { return OBJECT_OFFSETOF(ScopedArguments, m_overrodeThings); }
    static constexpr ptrdiff_t offsetOfTotalLength() { return OBJECT_OFFSETOF(ScopedArguments, m_totalLength); }
    static constexpr ptrdiff_t offsetOfTable() { return OBJECT_OFFSETOF(ScopedArguments, m_table); }
    static constexpr ptrdiff_t offsetOfScope() { return OBJECT_OFFSETOF(ScopedArguments, m_scope); }
    static constexpr ptrdiff_t offsetOfStorage() { return OBJECT_OFFSETOF(ScopedArguments, m_storage); }
    
private:
    WriteBarrier<Unknown>* storage() const
    {
        return m_storage.get();
    }

    DECLARE_DEFAULT_FINISH_CREATION;
    
    bool m_overrodeThings { false }; // True if length, callee, and caller are fully materialized in the object.
    bool m_hasUnmappedArgument { false };
    unsigned m_totalLength; // The length of declared plus overflow arguments.
    WriteBarrier<JSFunction> m_callee;
    WriteBarrier<ScopedArgumentsTable> m_table;
    WriteBarrier<JSLexicalEnvironment> m_scope;
    
    AuxiliaryBarrier<WriteBarrier<Unknown>*> m_storage;
};

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
