/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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

#include "HashMapHelper.h"
#include "JSImmutableButterfly.h"
#include "JSObject.h"

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

struct MapTraits {
    // DataTable:  [ Key_0, Val_0, NextKeyIndexInChain_0, Key_1, Val_1, NextKeyIndexInChain_1, ... ]
    //             | <------------ Entry_0 -----------> | <------------ Entry_1 -----------> |
    static constexpr uint8_t EntrySize = 3;
    static constexpr bool hasValueData = true;
};

struct SetTraits {
    // DataTable:  [ Key_0, NextKeyIndexInChain_0, Key_1, NextKeyIndexInChain_1, ... ]
    //             | <-------- Entry_0 --------> | <-------- Entry_1 --------> |
    static constexpr uint8_t EntrySize = 2;
    static constexpr bool hasValueData = false;
};

template<typename Traits>
class OrderedHashTable;

// ################ NonObsolete Table ################
//
//                      Count                                    Value(s)                           ValueType                  WriteBarrier
//               -------------------------------------------------------------------------------------------------------------------------------------
// TableStart ->           1          | AliveEntryCount                                            | TableSize                | NO
//                         1          | DeletedEntryCount                                          | TableSize                | NO
//                         1          | Capacity                                                   | TableSize                | NO
//                         1          | IterationEntry                                             | Entry                    | NO
//                    BucketCount     | HashTable:  { <BucketIndex, ChainStartKeyIndex>, ... }     | <TableIndex, TableIndex> | NO
//  TableEnd  -> Capacity * EntrySize | DataTable:  { <Entry_0, Data_0>, <Entry_1, Data_1>, ... }  | <TableIndex, JSValue>    | Yes (Key or Value)
//
// ################ Obsolete Table from Rehash ################
//
//                      Count                                    Value(s)                            ValueType                  WriteBarrier
//               -------------------------------------------------------------------------------------------------------------------------------------
// TableStart ->           1          | NextTable                                                   | JSCell                   | Yes
//                         1          | DeletedEntryCount                                           | TableSize                | NO
//                  DeletedEntryCount | DeletedEntries: [DeletedEntry_i, ...]                       | Entry                    | NO
//  TableEnd  ->          ...         | NotUsed                                                     | ...
//
// ################ Obsolete Table from Clear ################
//
//                      Count                                    Value(s)                            ValueType                  WriteBarrier
//               -------------------------------------------------------------------------------------------------------------------------------------
// TableStart ->           1          | NextTable                                                   | JSCell                   | Yes
//                         1          | ClearedTableSentinel                                        | TableSize                | NO
//  TableEnd  ->          ...         | NotUsed                                                     | ...
//
//
// This is based on the idea of CloseTable introduced in https://wiki.mozilla.org/User:Jorend/Deterministic_hash_tables.
//
// NonObsolete Table: A CloseTable flattened into a single array.
//
// - AliveEntryCount: The number of alive entries in the table.
// - DeletedEntryCount: The number of deleted entries in the table.
// - Capacity: The capacity of entries in the table.
// - IterationEntry: The temporary index only used for iteration.
// - HashTable: CloseTable is based on closed hashing. So, the each bucket in the HashTable points to the start EntryKeyIndex in the collision chain.
//   - FIXME: We can get rid of HashTable by applying OpenTable.
// - DataTable: The actual data table holds the tuples of key, value, and NextKeyIndexInChain for each entry.
//
//      Iterator                                   Map/Set
//          |                                         |
//          v                                         v
//    ObsoleteTable_0 --> ObsoleteTable_1 --> NonObsoleteTable_2
//
// Obsolete Table: Each rehash and clear would create a new table and update the obsolete one with additional info. Those info are used to
// transit the iterator (pointing to the obsolete table) to the latest alive table.
//
// - NextTable: A transition from the obsolete tables to the latest-non-obsolete one.
// - DeletedEntries: An array of the previously deleted entries used for updating iterator's index.
// - ClearedTableSentinel: The sentinel to indicate whether the obsolete table is retired due to a clearance.
//
// Note that all elements in the JSImmutableButterfly are in JSValue type. However, only the key and value in the DataTable are real JSValues.
// The others are used as unsigned integers wrapped by JSValue.
template<typename Traits>
class OrderedHashTableHelper {
public:
    using Storage = JSImmutableButterfly;
    using Helper = OrderedHashTableHelper<Traits>;
    using HashTable = OrderedHashTable<Traits>;
    using TableSize = uint32_t;
    using Entry = TableSize;
    using TableIndex = TableSize;

    static constexpr TableSize ClearedTableSentinel = -1;
    static constexpr TableIndex InvalidTableIndex = -1;
    static constexpr uint8_t EntrySize = Traits::EntrySize;
    static constexpr uint8_t ChainOffset = Traits::EntrySize - 1;

    static constexpr uint8_t LoadFactor = 1;
    static constexpr uint8_t InitialCapacity = 8;
    static constexpr TableSize LargeCapacity = 2 << 15;

    static_assert(EntrySize == MapTraits::EntrySize || EntrySize == SetTraits::EntrySize);

    OrderedHashTableHelper() = delete;

    ALWAYS_INLINE static TableSize toNumber(JSValue number) { return static_cast<TableSize>(number.asInt32()); }
    ALWAYS_INLINE static constexpr TableSize asNumber(Storage& storage, TableIndex index) { return toNumber(get(storage, index)); }
    ALWAYS_INLINE static JSValue toJSValue(Entry entry)
    {
        JSValue value = JSValue();
        OrderedHashTableTraits::set(&value, entry);
        return value;
    }

    ALWAYS_INLINE static bool isDeleted(VM& vm, JSValue value) { return value.isCell() && value.asCell() == vm.orderedHashTableDeletedValue(); }
    ALWAYS_INLINE static constexpr bool isValidTableIndex(TableIndex index) { return index != InvalidTableIndex; }
    ALWAYS_INLINE static JSValue invalidTableIndex() { return toJSValue(InvalidTableIndex); }

    ALWAYS_INLINE static JSValue get(Storage& storage, TableIndex index) { return storage.toButterfly()->contiguous().atUnsafe(index).get(); }
    ALWAYS_INLINE static JSValue* slot(Storage& storage, TableIndex index) { return storage.toButterfly()->contiguous().atUnsafe(index).slot(); }

    ALWAYS_INLINE static void set(Storage& storage, TableIndex index, JSValue value) { return storage.toButterfly()->contiguous().atUnsafe(index).setWithoutWriteBarrier(value); }
    ALWAYS_INLINE static void set(Storage& storage, TableIndex index, TableSize number) { OrderedHashTableTraits::set(slot(storage, index), number); }
    ALWAYS_INLINE static void setWithWriteBarrier(VM& vm, Storage& storage, TableIndex index, JSValue value) { storage.toButterfly()->contiguous().atUnsafe(index).set(vm, &storage, value); }

    /* -------------------------------- AliveEntryCount, DeletedEntryCount, Capacity, and IterationEntry -------------------------------- */
    ALWAYS_INLINE static constexpr TableIndex aliveEntryCountIndex() { return 0; }
    ALWAYS_INLINE static constexpr TableIndex deletedEntryCountIndex() { return aliveEntryCountIndex() + 1; }
    ALWAYS_INLINE static constexpr TableIndex capacityIndex() { return deletedEntryCountIndex() + 1; }
    ALWAYS_INLINE static constexpr TableIndex iterationEntryIndex() { return capacityIndex() + 1; }

    ALWAYS_INLINE static constexpr TableSize aliveEntryCount(Storage& storage) { return asNumber(storage, aliveEntryCountIndex()); }
    ALWAYS_INLINE static constexpr TableSize deletedEntryCount(Storage& storage) { return asNumber(storage, deletedEntryCountIndex()); }
    ALWAYS_INLINE static constexpr TableSize usedCapacity(Storage& storage) { return aliveEntryCount(storage) + deletedEntryCount(storage); }
    ALWAYS_INLINE static constexpr TableSize capacity(Storage& storage) { return asNumber(storage, capacityIndex()); }
    ALWAYS_INLINE static constexpr TableSize iterationEntry(Storage& storage) { return asNumber(storage, iterationEntryIndex()); }

    ALWAYS_INLINE static constexpr void incrementAliveEntryCount(Storage& storage) { OrderedHashTableTraits::increment(slot(storage, aliveEntryCountIndex())); }
    ALWAYS_INLINE static constexpr void decrementAliveEntryCount(Storage& storage) { OrderedHashTableTraits::decrement(slot(storage, aliveEntryCountIndex())); }
    ALWAYS_INLINE static constexpr void incrementDeletedEntryCount(Storage& storage) { OrderedHashTableTraits::increment(slot(storage, deletedEntryCountIndex())); }

    /* -------------------------------- Hash table -------------------------------- */
    ALWAYS_INLINE static constexpr TableSize bucketCount(TableSize capacity) { return capacity / LoadFactor; }

    ALWAYS_INLINE static constexpr TableIndex hashTableStartIndex() { return iterationEntryIndex() + 1; }
    ALWAYS_INLINE static constexpr TableIndex hashTableEndIndex(TableSize capacity) { return hashTableStartIndex() + bucketCount(capacity) - 1; }

    ALWAYS_INLINE static constexpr TableIndex bucketIndex(TableIndex hashTableStartIndex, TableSize bucketCount, TableSize hash) { return hashTableStartIndex + (hash & (bucketCount - 1)); }
    ALWAYS_INLINE static constexpr TableIndex bucketIndex(TableSize capacity, uint32_t hash) { return bucketIndex(hashTableStartIndex(), bucketCount(capacity), hash); }

    /* -------------------------------- Data table -------------------------------- */
    ALWAYS_INLINE static constexpr TableSize dataTableSize(TableSize capacity) { return capacity * EntrySize; }

    ALWAYS_INLINE static constexpr TableIndex dataTableStartIndex(TableSize capacity) { return hashTableEndIndex(capacity) + 1; }
    ALWAYS_INLINE static constexpr TableIndex dataTableEndIndex(TableSize capacity) { return dataTableStartIndex(capacity) + dataTableSize(capacity) - 1; }
    ALWAYS_INLINE static constexpr TableIndex entryDataStartIndex(TableIndex dataTableStartIndex, Entry entry) { return dataTableStartIndex + entry * EntrySize; }

    ALWAYS_INLINE static void setKeyOrValueData(VM& vm, Storage& storage, TableIndex index, JSValue value) { setWithWriteBarrier(vm, storage, index, value); }
    ALWAYS_INLINE static constexpr void deleteData(VM& vm, Storage& storage, TableIndex index) { return set(storage, index, vm.orderedHashTableDeletedValue()); }

    ALWAYS_INLINE static void addToChain(Storage& storage, TableIndex bucketIndex, TableIndex newChainStartKeyIndex)
    {
        JSValue prevChainStartKeyIndex = get(storage, bucketIndex);
        set(storage, bucketIndex, newChainStartKeyIndex);
        set(storage, newChainStartKeyIndex + ChainOffset, prevChainStartKeyIndex);
    }

    /* -------------------------------- OrderedHashTable -------------------------------- */
    ALWAYS_INLINE static constexpr TableSize tableSize(TableSize capacity)
    {
        TableSize result = 4 /* AliveEntryCount, DeletedEntryCount, Capacity, and IterationEntry */
            + capacity / LoadFactor /* BucketCount */
            + capacity * EntrySize; /* DataTableSize */
        ASSERT(result == tableSizeSlow(capacity));
        return result;
    }
    ALWAYS_INLINE static constexpr TableSize tableSizeSlow(TableSize capacity) { return dataTableEndIndex(capacity) + 1; }

    /* -------------------------------- Obsolete table -------------------------------- */
    ALWAYS_INLINE static constexpr bool isObsolete(Storage& storage) { return !!nextTable(storage); }
    ALWAYS_INLINE static constexpr Storage* nextTable(Storage& storage)
    {
        JSValue* value = slot(storage, aliveEntryCountIndex());
        if (value->isCell()) {
            ASSERT(jsDynamicCast<Storage*>(*value));
            return jsCast<Storage*>(*value);
        }
        return nullptr;
    }
    ALWAYS_INLINE static constexpr void setNextTable(VM& vm, Storage& storage, Storage* next) { setWithWriteBarrier(vm, storage, aliveEntryCountIndex(), next); }

    ALWAYS_INLINE static constexpr TableIndex deletedEntriesStartIndex() { return capacityIndex(); }

    ALWAYS_INLINE static constexpr bool isCleared(Storage& storage) { return asNumber(storage, deletedEntryCountIndex()) == ClearedTableSentinel; }
    ALWAYS_INLINE static constexpr void setClearedTableSentinel(Storage& storage) { set(storage, deletedEntryCountIndex(), ClearedTableSentinel); }

    /* ------------------------------------------------------------------------------------ */

    ALWAYS_INLINE static Storage* tryCreate(VM& vm, int length)
    {
        return Storage::tryCreate(vm, vm.immutableButterflyStructures[arrayIndexFromIndexingType(CopyOnWriteArrayWithContiguous) - NumberOfIndexingShapes].get(), length);
    }
    ALWAYS_INLINE static Storage* tryCreate(JSGlobalObject* globalObject, TableSize aliveEntryCount = 0, TableSize deletedEntryCount = 0, TableSize capacity = InitialCapacity)
    {
        VM& vm = getVM(globalObject);
        auto scope = DECLARE_THROW_SCOPE(vm);
        ASSERT(!(capacity & (capacity - 1)));

        TableSize length = tableSize(capacity);
        if (UNLIKELY(length > IndexingHeader::maximumLength)) {
            throwOutOfMemoryError(globalObject, scope);
            return nullptr;
        }

        Storage* storage = tryCreate(vm, length);
        if (UNLIKELY(!storage)) {
            throwOutOfMemoryError(globalObject, scope);
            return nullptr;
        }

        Storage& storageRef = *storage;
        set(storageRef, aliveEntryCountIndex(), aliveEntryCount);
        set(storageRef, deletedEntryCountIndex(), deletedEntryCount);
        set(storageRef, capacityIndex(), capacity);
        return storage;
    }

    enum class UpdateDeletedEntries : uint8_t {
        Yes,
        No
    };
    template<UpdateDeletedEntries update = UpdateDeletedEntries::No>
    ALWAYS_INLINE static Storage* copyImpl(JSGlobalObject* globalObject, Storage& base, TableSize newCapacity)
    {
        VM& vm = getVM(globalObject);
        auto scope = DECLARE_THROW_SCOPE(vm);

        TableSize baseCapacity = capacity(base);
        TableSize baseAliveEntryCount = aliveEntryCount(base);
        TableSize baseUsedCapacity = usedCapacity(base);
        ASSERT(!isObsolete(base));
        ASSERT_UNUSED(baseAliveEntryCount, newCapacity >= std::max(static_cast<TableSize>(InitialCapacity), baseAliveEntryCount));
        ASSERT_UNUSED(baseCapacity, baseUsedCapacity <= baseCapacity);

        Storage* copy = tryCreate(globalObject, baseAliveEntryCount, 0, newCapacity);
        RETURN_IF_EXCEPTION(scope, nullptr);

        TableIndex baseEntryKeyIndex = dataTableStartIndex(baseCapacity) - EntrySize;
        TableIndex baseDeletedEntriesIndex = deletedEntriesStartIndex();

        Storage& copyRef = *copy;
        TableIndex newEntryKeyIndex = dataTableStartIndex(newCapacity) - EntrySize;
        TableIndex newHashTableStartIndex = hashTableStartIndex();
        TableIndex newBucketCount = bucketCount(newCapacity);

        for (Entry baseEntry = 0; baseEntry < baseUsedCapacity; ++baseEntry) {
            baseEntryKeyIndex += EntrySize;
            JSValue baseKey = get(base, baseEntryKeyIndex);
            ASSERT(!baseKey.isEmpty());

            // Step 1: Copy DataTable only for the alive entries.
            if (isDeleted(vm, baseKey)) {
                if constexpr (update == UpdateDeletedEntries::Yes)
                    set(base, baseDeletedEntriesIndex++, baseEntry);
                continue;
            }

            // Step 2: Copy the key and value from the base table to the new table.
            newEntryKeyIndex += EntrySize;
            setKeyOrValueData(vm, copyRef, newEntryKeyIndex, baseKey);
            if constexpr (Traits::hasValueData) {
                JSValue baseValue = get(base, baseEntryKeyIndex + 1);
                setKeyOrValueData(vm, copyRef, newEntryKeyIndex + 1, baseValue);
            }

            // Step 3: Compute for the hash value and add to the chain in the new table. Note that the
            // key stored in the base table is already normalized.
            TableSize hash = jsMapHash(globalObject, vm, baseKey);
            RETURN_IF_EXCEPTION(scope, nullptr);
            TableIndex newBucketIndex = bucketIndex(newHashTableStartIndex, newBucketCount, hash);
            addToChain(copyRef, newBucketIndex, newEntryKeyIndex);
        }

        return copy;
    }
    ALWAYS_INLINE static Storage* copy(JSGlobalObject* globalObject, Storage& base)
    {
        return copyImpl<>(globalObject, base, capacity(base));
    }

    enum class UpdateOwnerStorage : uint8_t {
        Yes,
        No
    };
    template<UpdateOwnerStorage update>
    ALWAYS_INLINE static Storage* rehash(JSGlobalObject* globalObject, HashTable* owner, Storage& base, TableSize newCapacity)
    {
        VM& vm = getVM(globalObject);
        auto scope = DECLARE_THROW_SCOPE(vm);

        Storage* copy = copyImpl<UpdateDeletedEntries::Yes>(globalObject, base, newCapacity);
        RETURN_IF_EXCEPTION(scope, nullptr);

        setNextTable(vm, base, copy);
        if constexpr (update == UpdateOwnerStorage::Yes)
            owner->m_storage.set(vm, owner, copy);
        return copy;
    }

    ALWAYS_INLINE static void clear(JSGlobalObject* globalObject, HashTable* owner, Storage& base)
    {
        VM& vm = getVM(globalObject);
        auto scope = DECLARE_THROW_SCOPE(vm);

        Storage* next = tryCreate(globalObject);
        RETURN_IF_EXCEPTION(scope, void());

        setClearedTableSentinel(base);
        setNextTable(vm, base, next);
        owner->m_storage.set(vm, owner, next);
    }

    struct FindResult {
        JSValue normalizedKey;
        uint32_t hash;
        TableIndex bucketIndex;
        TableIndex entryKeyIndex;
        // The keyIndex and keySlot may be redundant here. Let's leave it for now
        // since the following OpenTable patch can get rid of most of index related info for us.
        JSValue* entryKeySlot;
    };
    ALWAYS_INLINE static FindResult find(JSGlobalObject* globalObject, Storage& storage, JSValue key)
    {
        VM& vm = getVM(globalObject);
        auto scope = DECLARE_THROW_SCOPE(vm);
        ASSERT(!isObsolete(storage));

        if (!aliveEntryCount(storage))
            return { JSValue(), 0, InvalidTableIndex, InvalidTableIndex, nullptr };

        key = normalizeMapKey(key);
        TableSize hash = jsMapHash(globalObject, vm, key);
        RETURN_IF_EXCEPTION(scope, { });
        return find(globalObject, storage, key, hash);
    }
    ALWAYS_INLINE static FindResult find(JSGlobalObject* globalObject, Storage& storage, JSValue normalizedKey, TableSize hash)
    {
        VM& vm = getVM(globalObject);
        TableIndex bucketIndex = Helper::bucketIndex(capacity(storage), hash);
        ASSERT(!isObsolete(storage) && normalizeMapKey(normalizedKey) == normalizedKey);

        JSValue keyIndexValue = get(storage, bucketIndex);
        while (!keyIndexValue.isEmpty()) {
            TableIndex entryKeyIndex = toNumber(keyIndexValue);
            JSValue* entryKeySlot = slot(storage, entryKeyIndex);
            // Fixme: Maybe we can compress the searching path by updating the chain with non-deleted entry.
            if (!isDeleted(vm, *entryKeySlot) && areKeysEqual(globalObject, normalizedKey, *entryKeySlot))
                return { normalizedKey, hash, bucketIndex, entryKeyIndex, entryKeySlot };
            keyIndexValue = get(storage, entryKeyIndex + ChainOffset);
        }
        return { normalizedKey, hash, bucketIndex, InvalidTableIndex, nullptr };
    }

    ALWAYS_INLINE static Storage* expandIfNeeded(JSGlobalObject* globalObject, HashTable* owner, Storage& base)
    {
        ASSERT(!isObsolete(base));
        TableSize capacity = Helper::capacity(base);
        TableSize deletedEntryCount = Helper::deletedEntryCount(base);
        TableSize usedCapacity = Helper::aliveEntryCount(base) + deletedEntryCount;

        bool isSmallCapacity = capacity < LargeCapacity;
        TableSize expandFactor = isSmallCapacity ? 2 : 1;

        if (isSmallCapacity) {
            if (usedCapacity < (capacity >> 1))
                return &base;
        } else {
            if (usedCapacity < ((capacity >> 2) * 3))
                return &base;
        }

        TableSize newCapacity = Checked<TableSize>(capacity) << expandFactor;
        if (deletedEntryCount >= (capacity >> 1))
            newCapacity = capacity; // No need to expanded. Just clear the deleted entries.
        return rehash<UpdateOwnerStorage::No>(globalObject, owner, base, newCapacity);
    }
    template<typename FindKeyFunctor>
    ALWAYS_INLINE static void addImpl(JSGlobalObject* globalObject, HashTable* owner, Storage& base, JSValue key, JSValue value, const FindKeyFunctor& findKeyFunctor)
    {
        VM& vm = getVM(globalObject);
        auto scope = DECLARE_THROW_SCOPE(vm);
        ASSERT(!isObsolete(base));

        auto result = findKeyFunctor();
        RETURN_IF_EXCEPTION(scope, void());

        if (isValidTableIndex(result.entryKeyIndex)) {
            if constexpr (Traits::hasValueData)
                setKeyOrValueData(vm, base, result.entryKeyIndex + 1, value);
            return;
        }

        scope.release();
        addImpl(globalObject, owner, base, key, value, result);
    }
    ALWAYS_INLINE static void addImpl(JSGlobalObject* globalObject, HashTable* owner, Storage& base, JSValue key, JSValue value, FindResult& result)
    {
        VM& vm = getVM(globalObject);
        auto scope = DECLARE_THROW_SCOPE(vm);
        ASSERT(!isObsolete(base));

        ASSERT(!isValidTableIndex(result.entryKeyIndex));

        Storage* candidate = expandIfNeeded(globalObject, owner, base);
        RETURN_IF_EXCEPTION(scope, void());

        Storage& candidateRef = *candidate;
        TableSize capacity = Helper::capacity(candidateRef);
        Entry newEntry = usedCapacity(candidateRef);
        TableIndex newEntryKeyIndex = entryDataStartIndex(dataTableStartIndex(capacity), newEntry);
        incrementAliveEntryCount(candidateRef);

        bool firstAliveEntry = result.normalizedKey.isEmpty();
        if (UNLIKELY(firstAliveEntry)) {
            result.normalizedKey = normalizeMapKey(key);
            result.hash = jsMapHash(globalObject, vm, result.normalizedKey);
            RETURN_IF_EXCEPTION(scope, void());
        }

        bool rehashed = &base != candidate;
        if (UNLIKELY(rehashed || firstAliveEntry))
            result.bucketIndex = bucketIndex(capacity, result.hash);

        addToChain(candidateRef, result.bucketIndex, newEntryKeyIndex);
        setKeyOrValueData(vm, candidateRef, newEntryKeyIndex, result.normalizedKey);
        if constexpr (Traits::hasValueData)
            setKeyOrValueData(vm, candidateRef, newEntryKeyIndex + 1, value);

        if (UNLIKELY(rehashed))
            owner->m_storage.set(vm, owner, candidate);
    }
    ALWAYS_INLINE static void add(JSGlobalObject* globalObject, HashTable* owner, Storage& storage, JSValue key, JSValue value)
    {
        addImpl(globalObject, owner, storage, key, value, [&]() ALWAYS_INLINE_LAMBDA {
            return find(globalObject, storage, key);
        });
    }
    ALWAYS_INLINE static void addNormalized(JSGlobalObject* globalObject, HashTable* owner, Storage& storage, JSValue normalizedKey, JSValue value, TableSize hash)
    {
        ASSERT(normalizeMapKey(normalizedKey) == normalizedKey);
        addImpl(globalObject, owner, storage, normalizedKey, value, [&]() ALWAYS_INLINE_LAMBDA {
            return find(globalObject, storage, normalizedKey, hash);
        });
    }

    ALWAYS_INLINE static void shrinkIfNeeded(JSGlobalObject* globalObject, HashTable* owner, Storage& base)
    {
        ASSERT(!isObsolete(base));
        TableSize capacity = Helper::capacity(base);
        TableSize aliveEntryCount = Helper::aliveEntryCount(base);
        if (aliveEntryCount >= (capacity >> 3))
            return;
        if (capacity == InitialCapacity)
            return;
        rehash<UpdateOwnerStorage::Yes>(globalObject, owner, base, capacity >> 1);
    }
    template<typename FindKeyFunctor>
    ALWAYS_INLINE static bool removeImpl(JSGlobalObject* globalObject, HashTable* owner, Storage& storage, const FindKeyFunctor& findKeyFunctor)
    {
        VM& vm = getVM(globalObject);
        auto scope = DECLARE_THROW_SCOPE(vm);
        ASSERT(!isObsolete(storage));

        auto result = findKeyFunctor();
        RETURN_IF_EXCEPTION(scope, false);

        if (!isValidTableIndex(result.entryKeyIndex))
            return false;

        deleteData(vm, storage, result.entryKeyIndex);
        if constexpr (Traits::hasValueData)
            deleteData(vm, storage, result.entryKeyIndex + 1);
        incrementDeletedEntryCount(storage);
        decrementAliveEntryCount(storage);

        scope.release();
        shrinkIfNeeded(globalObject, owner, storage);
        return true;
    }
    ALWAYS_INLINE static bool remove(JSGlobalObject* globalObject, HashTable* owner, Storage& storage, JSValue key)
    {
        return removeImpl(globalObject, owner, storage, [&]() ALWAYS_INLINE_LAMBDA {
            return find(globalObject, storage, key);
        });
    }
    ALWAYS_INLINE static bool removeNormalized(JSGlobalObject* globalObject, HashTable* owner, Storage& storage, JSValue normalizedKey, TableSize hash)
    {
        ASSERT(normalizeMapKey(normalizedKey) == normalizedKey);
        return removeImpl(globalObject, owner, storage, [&]() ALWAYS_INLINE_LAMBDA {
            return find(globalObject, storage, normalizedKey, hash);
        });
    }

    template<typename Functor>
    ALWAYS_INLINE static Storage& transit(Storage& storage, const Functor& functor)
    {
        Storage* ptr = &storage;
        while (isObsolete(*ptr)) {
            functor(*ptr);
            ptr = nextTable(*ptr);
        }
        return *ptr;
    }
    struct TransitionResult {
        Storage* storage;
        Entry entry;
        JSValue key;
        JSValue value;
    };
    ALWAYS_INLINE static TransitionResult transitAndNext(VM& vm, Storage& storage, Entry from)
    {
        Storage& candidate = transit(storage, [&](Storage& obsolete) ALWAYS_INLINE_LAMBDA {
            if (!from)
                return;

            if (isCleared(obsolete)) {
                from = 0;
                return;
            }

            TableIndex deletedEntryCount = Helper::deletedEntryCount(obsolete);
            if (!deletedEntryCount)
                return;

            TableIndex start = deletedEntriesStartIndex();
            TableIndex end = start + deletedEntryCount;
            Entry fromCopy = from;
            for (TableIndex i = start; i < end; ++i) {
                Entry deletedEntry = toNumber(get(obsolete, i));
                if (deletedEntry >= fromCopy)
                    break;
                --from;
            }
        });

        ASSERT(!isObsolete(candidate));
        TableSize capacity = Helper::capacity(candidate);
        TableSize usedCapacity = Helper::usedCapacity(candidate);
        TableIndex entryKeyIndex = entryDataStartIndex(dataTableStartIndex(capacity), from) - EntrySize;
        for (Entry entry = from; entry < usedCapacity; ++entry) {
            entryKeyIndex += EntrySize;
            JSValue key = get(candidate, entryKeyIndex);
            if (isDeleted(vm, key))
                continue;

            JSValue value;
            if constexpr (Traits::hasValueData)
                value = get(candidate, entryKeyIndex + 1);
            return { &candidate, entry, key, value };
        }
        return { };
    }

    ALWAYS_INLINE static JSValue getKey(Storage& storage, Entry entry)
    {
        ASSERT(!isObsolete(storage));
        return get(storage, entryDataStartIndex(dataTableStartIndex(capacity(storage)), entry));
    }
    ALWAYS_INLINE static JSValue getValue(Storage& storage, Entry entry)
    {
        ASSERT(!isObsolete(storage) && EntrySize == 3);
        return get(storage, entryDataStartIndex(dataTableStartIndex(capacity(storage)), entry) + 1);
    }
    ALWAYS_INLINE static JSCell* nextAndUpdateIterationEntry(VM& vm, Storage& storage, Entry entry)
    {
        auto result = transitAndNext(vm, storage, entry);
        if (!result.storage)
            return vm.orderedHashTableSentinel();
        set(*result.storage, iterationEntryIndex(), result.entry);
        return result.storage;
    }
    ALWAYS_INLINE static JSValue getIterationEntry(Storage& storage) { return toJSValue(iterationEntry(storage)); }
    ALWAYS_INLINE static JSValue getIterationEntryKey(Storage& storage) { return getKey(storage, iterationEntry(storage)); }
    ALWAYS_INLINE static JSValue getIterationEntryValue(Storage& storage) { return getValue(storage, iterationEntry(storage)); }
};

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
