/*
 * Copyright (C) 2013-2024 Apple, Inc. All rights reserved.
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

#include "IterationKind.h"
#include "JSInternalFieldObjectImpl.h"
#include "JSMap.h"

namespace JSC {

const static uint8_t JSMapIteratorNumberOFInternalFields = 4;

class JSMapIterator final : public JSInternalFieldObjectImpl<JSMapIteratorNumberOFInternalFields> {
public:
    using Base = JSInternalFieldObjectImpl<JSMapIteratorNumberOFInternalFields>;

    DECLARE_EXPORT_INFO;

    enum class Field : uint8_t {
        Entry = 0,
        IteratedObject,
        Storage,
        Kind,
    };
    static_assert(numberOfInternalFields == JSMapIteratorNumberOFInternalFields);

    static std::array<JSValue, numberOfInternalFields> initialValues()
    {
        return { {
            jsNumber(0),
            jsNull(),
            jsNull(),
            jsNumber(0),
        } };
    }

    const WriteBarrier<Unknown>& internalField(Field field) const { return Base::internalField(static_cast<uint32_t>(field)); }
    WriteBarrier<Unknown>& internalField(Field field) { return Base::internalField(static_cast<uint32_t>(field)); }

    template<typename CellType, SubspaceAccess mode>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return vm.mapIteratorSpace<mode>();
    }

    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue);

    static JSMapIterator* create(JSGlobalObject* globalObject, Structure* structure, JSMap* iteratedObject, IterationKind kind)
    {
        VM& vm = getVM(globalObject);
        JSMapIterator* instance = new (NotNull, allocateCell<JSMapIterator>(vm)) JSMapIterator(vm, structure);
        instance->finishCreation(globalObject, iteratedObject, kind);
        return instance;
    }

    static JSMapIterator* createWithInitialValues(VM&, Structure*);

    struct NextResult {
        JSValue key;
        JSValue value;
    };
    ALWAYS_INLINE NextResult nextWithAdvance(VM& vm)
    {
        JSCell* storage = this->storage();
        JSCell* sentinel = vm.orderedHashTableSentinel();
        if (storage == sentinel)
            return { };

        JSMap::Storage& storageRef = *jsCast<JSMap::Storage*>(storage);
        auto result = JSMap::Helper::transitAndNext(vm, storageRef, entry());
        if (!result.storage) {
            setStorage(vm, sentinel);
            return { };
        }

        setEntry(vm, result.entry + 1);
        if (result.storage != storage)
            setStorage(vm, result.storage);
        return { result.key, result.value };
    }
    bool next(JSGlobalObject* globalObject, JSValue& value)
    {
        auto result = nextWithAdvance(globalObject->vm());
        if (result.key.isEmpty())
            return false;

        switch (kind()) {
        case IterationKind::Values:
            value = result.value;
            break;
        case IterationKind::Keys:
            value = result.key;
            break;
        case IterationKind::Entries:
            value = createTuple(globalObject, result.key, result.value);
            break;
        }
        return true;
    }
    bool nextKeyValue(JSGlobalObject* globalObject, JSValue& key, JSValue& value)
    {
        auto result = nextWithAdvance(globalObject->vm());
        if (result.key.isEmpty())
            return false;

        key = result.key;
        value = result.value;
        return true;
    }

    JSValue next(VM& vm)
    {
        auto result = nextWithAdvance(vm);
        return result.key.isEmpty() ? jsBoolean(true) : jsBoolean(false);
    }
    JSValue nextKey(VM& vm)
    {
        JSMap::Helper::Entry entry = this->entry() - 1;
        JSCell* storage = this->storage();
        ASSERT_UNUSED(vm, storage != vm.orderedHashTableSentinel());
        JSMap::Storage& storageRef = *jsCast<JSMap::Storage*>(storage);
        return JSMap::Helper::getKey(storageRef, entry);
    }
    JSValue nextValue(VM& vm)
    {
        JSMap::Helper::Entry entry = this->entry() - 1;
        JSCell* storage = this->storage();
        ASSERT_UNUSED(vm, storage != vm.orderedHashTableSentinel());
        JSMap::Storage& storageRef = *jsCast<JSMap::Storage*>(storage);
        return JSMap::Helper::getValue(storageRef, entry);
    }

    IterationKind kind() const { return static_cast<IterationKind>(internalField(Field::Kind).get().asUInt32AsAnyInt()); }
    JSObject* iteratedObject() const { return jsCast<JSObject*>(internalField(Field::IteratedObject).get()); }
    JSCell* storage() const { return internalField(Field::Storage).get().asCell(); }
    JSMap::Helper::Entry entry() const { return JSMap::Helper::toNumber(internalField(Field::Entry).get()); }

    void setIteratedObject(VM& vm, JSMap* map) { internalField(Field::IteratedObject).set(vm, this, map); }
    void setStorage(VM& vm, JSCell* storage) { internalField(Field::Storage).set(vm, this, storage); }
    void setEntry(VM& vm, JSMap::Helper::Entry entry) { internalField(Field::Entry).set(vm, this, JSMap::Helper::toJSValue(entry)); }

private:
    JSMapIterator(VM& vm, Structure* structure)
        : Base(vm, structure)
    {
    }

    JS_EXPORT_PRIVATE void finishCreation(JSGlobalObject*, JSMap*, IterationKind);
    void finishCreation(VM&);
    DECLARE_VISIT_CHILDREN;
};
STATIC_ASSERT_IS_TRIVIALLY_DESTRUCTIBLE(JSMapIterator);

JSC_DECLARE_HOST_FUNCTION(mapIteratorPrivateFuncMapIteratorNext);
JSC_DECLARE_HOST_FUNCTION(mapIteratorPrivateFuncMapIteratorKey);
JSC_DECLARE_HOST_FUNCTION(mapIteratorPrivateFuncMapIteratorValue);

} // namespace JSC
