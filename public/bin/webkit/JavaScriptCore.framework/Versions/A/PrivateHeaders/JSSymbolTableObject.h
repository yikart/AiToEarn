/*
 * Copyright (C) 2012-2021 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer. 
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution. 
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission. 
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "JSScope.h"
#include "PropertyDescriptor.h"
#include "SymbolTable.h"
#include "ThrowScope.h"
#include "VariableWriteFireDetail.h"

namespace JSC {

class JSSymbolTableObject : public JSScope {
public:
    using Base = JSScope;
    static constexpr unsigned StructureFlags = Base::StructureFlags | OverridesGetOwnSpecialPropertyNames;

    SymbolTable* symbolTable() const { return m_symbolTable.get(); }
    
    JS_EXPORT_PRIVATE static bool deleteProperty(JSCell*, JSGlobalObject*, PropertyName, DeletePropertySlot&);
    JS_EXPORT_PRIVATE static void getOwnSpecialPropertyNames(JSObject*, JSGlobalObject*, PropertyNameArray&, DontEnumPropertiesMode);
    
    static constexpr ptrdiff_t offsetOfSymbolTable() { return OBJECT_OFFSETOF(JSSymbolTableObject, m_symbolTable); }

    DECLARE_EXPORT_INFO;

protected:
    JSSymbolTableObject(VM& vm, Structure* structure, JSScope* scope)
        : Base(vm, structure, scope)
    {
    }
    
    JSSymbolTableObject(VM& vm, Structure* structure, JSScope* scope, SymbolTable* symbolTable)
        : Base(vm, structure, scope)
        , m_symbolTable(symbolTable, WriteBarrierEarlyInit)
    {
        ASSERT(symbolTable);
        symbolTable->notifyCreation(vm, this, "Allocated a scope");
    }
    
    void setSymbolTable(VM& vm, SymbolTable* symbolTable)
    {
        ASSERT(!m_symbolTable);
        symbolTable->notifyCreation(vm, this, "Allocated a scope");
        m_symbolTable.set(vm, this, symbolTable);
    }
    
    DECLARE_VISIT_CHILDREN;
    
private:
    WriteBarrier<SymbolTable> m_symbolTable;
};

template<typename SymbolTableObjectType>
inline bool symbolTableGet(
    SymbolTableObjectType* object, PropertyName propertyName, PropertySlot& slot)
{
    SymbolTable& symbolTable = *object->symbolTable();
    ConcurrentJSLocker locker(symbolTable.m_lock);
    SymbolTable::Map::iterator iter = symbolTable.find(locker, propertyName.uid());
    if (iter == symbolTable.end(locker))
        return false;
    SymbolTableEntry::Fast entry = iter->value;
    ASSERT(!entry.isNull());

    ScopeOffset offset = entry.scopeOffset();
    // Defend against the inspector asking for a var after it has been optimized out.
    if (!object->isValidScopeOffset(offset))
        return false;

    slot.setValue(object, entry.getAttributes() | PropertyAttribute::DontDelete, object->variableAt(offset).get());
    return true;
}

template<typename SymbolTableObjectType>
inline bool symbolTableGet(
    SymbolTableObjectType* object, PropertyName propertyName, SymbolTableEntry& entry, PropertyDescriptor& descriptor)
{
    SymbolTable& symbolTable = *object->symbolTable();
    ConcurrentJSLocker locker(symbolTable.m_lock);
    SymbolTable::Map::iterator iter = symbolTable.find(locker, propertyName.uid());
    if (iter == symbolTable.end(locker))
        return false;
    entry = iter->value;
    ASSERT(!entry.isNull());

    ScopeOffset offset = entry.scopeOffset();
    // Defend against the inspector asking for a var after it has been optimized out.
    if (!object->isValidScopeOffset(offset))
        return false;

    descriptor.setDescriptor(object->variableAt(offset).get(), entry.getAttributes() | PropertyAttribute::DontDelete);
    return true;
}

template<typename SymbolTableObjectType>
ALWAYS_INLINE void symbolTablePutTouchWatchpointSet(VM& vm, SymbolTableObjectType* object, PropertyName propertyName, JSValue value, WriteBarrierBase<Unknown>* reg, WatchpointSet* set)
{
    reg->set(vm, object, value);
    if (set)
        VariableWriteFireDetail::touch(vm, set, object, propertyName);
}

template<typename SymbolTableObjectType>
ALWAYS_INLINE void symbolTablePutInvalidateWatchpointSet(VM& vm, SymbolTableObjectType* object, PropertyName propertyName, JSValue value, WriteBarrierBase<Unknown>* reg, WatchpointSet* set)
{
    reg->set(vm, object, value);
    if (set)
        set->invalidate(vm, VariableWriteFireDetail(object, propertyName)); // Don't mess around - if we had found this statically, we would have invalidated it.
}

enum class SymbolTablePutMode {
    Touch,
    Invalidate
};

template<SymbolTablePutMode symbolTablePutMode, typename SymbolTableObjectType>
inline bool symbolTablePut(SymbolTableObjectType* object, JSGlobalObject* globalObject, PropertyName propertyName, JSValue value, bool shouldThrowReadOnlyError, bool ignoreReadOnlyErrors, bool& putResult)
{
    VM& vm = getVM(globalObject);
    auto scope = DECLARE_THROW_SCOPE(vm);

    WatchpointSet* set = nullptr;
    WriteBarrierBase<Unknown>* reg;
    {
        SymbolTable& symbolTable = *object->symbolTable();
        // FIXME: This is very suspicious. We shouldn't need a GC-safe lock here.
        // https://bugs.webkit.org/show_bug.cgi?id=134601
        GCSafeConcurrentJSLocker locker(symbolTable.m_lock, vm);
        SymbolTable::Map::iterator iter = symbolTable.find(locker, propertyName.uid());
        if (iter == symbolTable.end(locker))
            return false;
        bool wasFat;
        SymbolTableEntry::Fast fastEntry = iter->value.getFast(wasFat);
        ASSERT(!fastEntry.isNull());
        if (fastEntry.isReadOnly() && !ignoreReadOnlyErrors) {
            if (shouldThrowReadOnlyError)
                throwTypeError(globalObject, scope, ReadonlyPropertyWriteError);
            putResult = false;
            return true;
        }

        ScopeOffset offset = fastEntry.scopeOffset();

        // Defend against the inspector asking for a var after it has been optimized out.
        if (!object->isValidScopeOffset(offset))
            return false;

        set = iter->value.watchpointSet();
        reg = &object->variableAt(offset);
    }
    // I'd prefer we not hold lock while executing barriers, since I prefer to reserve
    // the right for barriers to be able to trigger GC. And I don't want to hold VM
    // locks while GC'ing.
    if (symbolTablePutMode == SymbolTablePutMode::Invalidate)
        symbolTablePutInvalidateWatchpointSet(vm, object, propertyName, value, reg, set);
    else
        symbolTablePutTouchWatchpointSet(vm, object, propertyName, value, reg, set);
    putResult = true;
    return true;
}

template<typename SymbolTableObjectType>
inline bool symbolTablePutTouchWatchpointSet(
    SymbolTableObjectType* object, JSGlobalObject* globalObject, PropertyName propertyName, JSValue value,
    bool shouldThrowReadOnlyError, bool ignoreReadOnlyErrors, bool& putResult)
{
    ASSERT(!Heap::heap(value) || Heap::heap(value) == Heap::heap(object));
    return symbolTablePut<SymbolTablePutMode::Touch>(object, globalObject, propertyName, value, shouldThrowReadOnlyError, ignoreReadOnlyErrors, putResult);
}

template<typename SymbolTableObjectType>
inline bool symbolTablePutInvalidateWatchpointSet(
    SymbolTableObjectType* object, JSGlobalObject* globalObject, PropertyName propertyName, JSValue value,
    bool shouldThrowReadOnlyError, bool ignoreReadOnlyErrors, bool& putResult)
{
    ASSERT(!Heap::heap(value) || Heap::heap(value) == Heap::heap(object));
    return symbolTablePut<SymbolTablePutMode::Invalidate>(object, globalObject, propertyName, value, shouldThrowReadOnlyError, ignoreReadOnlyErrors, putResult);
}

} // namespace JSC
