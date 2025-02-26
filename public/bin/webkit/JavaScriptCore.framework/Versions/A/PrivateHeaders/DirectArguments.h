/*
 * Copyright (C) 2015-2021 Apple Inc. All rights reserved.
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

#include "CagedBarrierPtr.h"
#include "DirectArgumentsOffset.h"
#include "GenericArguments.h"
#include <wtf/CagedPtr.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

// This is an Arguments-class object that we create when you say "arguments" inside a function,
// and none of the arguments are captured in the function's activation. The function will copy all
// of its arguments into this object, and all subsequent accesses to the arguments will go through
// this object thereafter. Special support is in place for mischevious events like the arguments
// being deleted (something like "delete arguments[0]") or reconfigured (broadly, we say deletions
// and reconfigurations mean that the respective argument was "overridden").
//
// To speed allocation, this object will hold all of the arguments in-place. The arguments as well
// as a table of flags saying which arguments were overridden.
class DirectArguments final : public GenericArguments<DirectArguments> {
private:
    DirectArguments(VM&, Structure*, unsigned length, unsigned capacity);
    
public:
    template<typename CellType, SubspaceAccess>
    static CompleteSubspace* subspaceFor(VM& vm)
    {
        static_assert(!CellType::needsDestruction);
        return &vm.variableSizedCellSpace();
    }

    // Creates an arguments object but leaves it uninitialized. This is dangerous if we GC right
    // after allocation.
    static DirectArguments* createUninitialized(VM&, Structure*, unsigned length, unsigned capacity);
    
    // Creates an arguments object and initializes everything to the empty value. Use this if you
    // cannot guarantee that you'll immediately initialize all of the elements.
    static DirectArguments* create(VM&, Structure*, unsigned length, unsigned capacity);
    
    // Creates an arguments object by copying the argumnets from the stack.
    static DirectArguments* createByCopying(JSGlobalObject*, CallFrame*);

    static size_t estimatedSize(JSCell*, VM&);
    DECLARE_VISIT_CHILDREN;
    
    uint32_t internalLength() const
    {
        return m_length;
    }
    
    uint32_t length(JSGlobalObject* globalObject) const
    {
        VM& vm = getVM(globalObject);
        auto scope = DECLARE_THROW_SCOPE(vm);
        if (UNLIKELY(m_mappedArguments)) {
            JSValue value = get(globalObject, vm.propertyNames->length);
            RETURN_IF_EXCEPTION(scope, { });
            RELEASE_AND_RETURN(scope, value.toUInt32(globalObject));
        }
        return m_length;
    }
    
    bool isMappedArgument(uint32_t i) const
    {
        return i < m_length && (!m_mappedArguments || !m_mappedArguments.at(i));
    }

    bool isMappedArgumentInDFG(uint32_t i) const
    {
        return i < m_length && !overrodeThings();
    }

    JSValue getIndexQuickly(uint32_t i) const
    {
        ASSERT_WITH_SECURITY_IMPLICATION(isMappedArgument(i));
        return const_cast<DirectArguments*>(this)->storage()[i].get();
    }
    
    void setIndexQuickly(VM& vm, uint32_t i, JSValue value)
    {
        ASSERT_WITH_SECURITY_IMPLICATION(isMappedArgument(i));
        storage()[i].set(vm, this, value);
    }
    
    JSFunction* callee()
    {
        return m_callee.get();
    }
    
    void setCallee(VM& vm, JSFunction* function)
    {
        m_callee.set(vm, this, function);
    }
    
    WriteBarrier<Unknown>& argument(DirectArgumentsOffset offset)
    {
        ASSERT(offset);
        ASSERT_WITH_SECURITY_IMPLICATION(offset.offset() < std::max(m_length, m_minCapacity));
        return storage()[offset.offset()];
    }
    
    // Methods intended for use by the GenericArguments mixin.
    bool overrodeThings() const { return !!m_mappedArguments; }
    void overrideThings(JSGlobalObject*);
    void overrideThingsIfNecessary(JSGlobalObject*);
    void unmapArgument(JSGlobalObject*, unsigned index);

    void initModifiedArgumentsDescriptorIfNecessary(JSGlobalObject* globalObject)
    {
        GenericArguments<DirectArguments>::initModifiedArgumentsDescriptorIfNecessary(globalObject, m_length);
    }

    void setModifiedArgumentDescriptor(JSGlobalObject* globalObject, unsigned index)
    {
        GenericArguments<DirectArguments>::setModifiedArgumentDescriptor(globalObject, index, m_length);
    }

    bool isModifiedArgumentDescriptor(unsigned index)
    {
        return GenericArguments<DirectArguments>::isModifiedArgumentDescriptor(index, m_length);
    }

    void copyToArguments(JSGlobalObject*, JSValue* firstElementDest, unsigned offset, unsigned length);

    static JSArray* fastSlice(JSGlobalObject*, DirectArguments*, uint64_t startIndex, uint64_t count);

    JS_EXPORT_PRIVATE bool isIteratorProtocolFastAndNonObservable();

    DECLARE_INFO;
    
    static Structure* createStructure(VM&, JSGlobalObject*, JSValue prototype);
    
    static constexpr ptrdiff_t offsetOfCallee() { return OBJECT_OFFSETOF(DirectArguments, m_callee); }
    static constexpr ptrdiff_t offsetOfLength() { return OBJECT_OFFSETOF(DirectArguments, m_length); }
    static constexpr ptrdiff_t offsetOfMinCapacity() { return OBJECT_OFFSETOF(DirectArguments, m_minCapacity); }
    static constexpr ptrdiff_t offsetOfMappedArguments() { return OBJECT_OFFSETOF(DirectArguments, m_mappedArguments); }
    static constexpr ptrdiff_t offsetOfModifiedArgumentsDescriptor() { return OBJECT_OFFSETOF(DirectArguments, m_modifiedArgumentsDescriptor); }
    
    static size_t storageOffset()
    {
        return WTF::roundUpToMultipleOf<sizeof(WriteBarrier<Unknown>)>(sizeof(DirectArguments));
    }
    
    static size_t offsetOfSlot(Checked<size_t> index)
    {
        return storageOffset() + sizeof(WriteBarrier<Unknown>) * index;
    }
    
    static size_t allocationSize(Checked<size_t> capacity)
    {
        return offsetOfSlot(capacity);
    }
    
private:
    WriteBarrier<Unknown>* storage()
    {
        return std::bit_cast<WriteBarrier<Unknown>*>(std::bit_cast<char*>(this) + storageOffset());
    }
    
    unsigned mappedArgumentsSize();
    
    WriteBarrier<JSFunction> m_callee;
    uint32_t m_length; // Always the actual length of captured arguments and never what was stored into the length property.
    uint32_t m_minCapacity; // The max of this and length determines the capacity of this object. It may be the actual capacity, or maybe something smaller. We arrange it this way to be kind to the JITs.
    using MappedArguments = CagedBarrierPtr<Gigacage::Primitive, bool>;
    MappedArguments m_mappedArguments; // If non-null, it means that length, callee, and caller are fully materialized properties.

    friend size_t cellSize(JSCell*);
};

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
