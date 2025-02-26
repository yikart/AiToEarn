/*
 * Copyright (C) 2013-2018 Apple Inc. All rights reserved.
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

#if ENABLE(FTL_JIT)

#include "B3Value.h"
#include "DFGArrayMode.h"
#include "FTLAbstractHeap.h"
#include "HasOwnPropertyCache.h"
#include "IndexingType.h"
#include "JSGlobalObject.h"
#include "JSGlobalProxy.h"
#include "JSMap.h"
#include "JSSet.h"
#include "JSWeakMap.h"
#include "NumericStrings.h"
#include "Symbol.h"

namespace JSC { namespace FTL {

#define FOR_EACH_ABSTRACT_HEAP(macro) \
    macro(typedArrayProperties) \
    macro(JSCellHeaderAndNamedProperties) \
    macro(OrderedHashTableData) \

#define FOR_EACH_ABSTRACT_FIELD(macro) \
    macro(ArrayBuffer_data, ArrayBuffer::offsetOfData()) \
    macro(ArrayStorage_numValuesInVector, ArrayStorage::numValuesInVectorOffset()) \
    macro(Butterfly_arrayBuffer, Butterfly::offsetOfArrayBuffer()) \
    macro(Butterfly_publicLength, Butterfly::offsetOfPublicLength()) \
    macro(Butterfly_vectorLength, Butterfly::offsetOfVectorLength()) \
    macro(CallFrame_callerFrame, CallFrame::callerFrameOffset()) \
    macro(ClassInfo_parentClass, ClassInfo::offsetOfParentClass()) \
    macro(ClonedArguments_callee, ClonedArguments::offsetOfCallee()) \
    macro(DateInstance_internalNumber, DateInstance::offsetOfInternalNumber()) \
    macro(DateInstance_data, DateInstance::offsetOfData()) \
    macro(DateInstanceData_gregorianDateTimeCachedForMS, DateInstanceData::offsetOfGregorianDateTimeCachedForMS()) \
    macro(DateInstanceData_gregorianDateTimeUTCCachedForMS, DateInstanceData::offsetOfGregorianDateTimeUTCCachedForMS()) \
    macro(DateInstanceData_cachedGregorianDateTime_year, DateInstanceData::offsetOfCachedGregorianDateTime() + GregorianDateTime::offsetOfYear()) \
    macro(DateInstanceData_cachedGregorianDateTimeUTC_year, DateInstanceData::offsetOfCachedGregorianDateTimeUTC() + GregorianDateTime::offsetOfYear()) \
    macro(DateInstanceData_cachedGregorianDateTime_month, DateInstanceData::offsetOfCachedGregorianDateTime() + GregorianDateTime::offsetOfMonth()) \
    macro(DateInstanceData_cachedGregorianDateTimeUTC_month, DateInstanceData::offsetOfCachedGregorianDateTimeUTC() + GregorianDateTime::offsetOfMonth()) \
    macro(DateInstanceData_cachedGregorianDateTime_monthDay, DateInstanceData::offsetOfCachedGregorianDateTime() + GregorianDateTime::offsetOfMonthDay()) \
    macro(DateInstanceData_cachedGregorianDateTimeUTC_monthDay, DateInstanceData::offsetOfCachedGregorianDateTimeUTC() + GregorianDateTime::offsetOfMonthDay()) \
    macro(DateInstanceData_cachedGregorianDateTime_weekDay, DateInstanceData::offsetOfCachedGregorianDateTime() + GregorianDateTime::offsetOfWeekDay()) \
    macro(DateInstanceData_cachedGregorianDateTimeUTC_weekDay, DateInstanceData::offsetOfCachedGregorianDateTimeUTC() + GregorianDateTime::offsetOfWeekDay()) \
    macro(DateInstanceData_cachedGregorianDateTime_hour, DateInstanceData::offsetOfCachedGregorianDateTime() + GregorianDateTime::offsetOfHour()) \
    macro(DateInstanceData_cachedGregorianDateTimeUTC_hour, DateInstanceData::offsetOfCachedGregorianDateTimeUTC() + GregorianDateTime::offsetOfHour()) \
    macro(DateInstanceData_cachedGregorianDateTime_minute, DateInstanceData::offsetOfCachedGregorianDateTime() + GregorianDateTime::offsetOfMinute()) \
    macro(DateInstanceData_cachedGregorianDateTimeUTC_minute, DateInstanceData::offsetOfCachedGregorianDateTimeUTC() + GregorianDateTime::offsetOfMinute()) \
    macro(DateInstanceData_cachedGregorianDateTime_second, DateInstanceData::offsetOfCachedGregorianDateTime() + GregorianDateTime::offsetOfSecond()) \
    macro(DateInstanceData_cachedGregorianDateTimeUTC_second, DateInstanceData::offsetOfCachedGregorianDateTimeUTC() + GregorianDateTime::offsetOfSecond()) \
    macro(DateInstanceData_cachedGregorianDateTime_utcOffsetInMinute, DateInstanceData::offsetOfCachedGregorianDateTime() + GregorianDateTime::offsetOfUTCOffsetInMinute()) \
    macro(DateInstanceData_cachedGregorianDateTimeUTC_utcOffsetInMinute, DateInstanceData::offsetOfCachedGregorianDateTimeUTC() + GregorianDateTime::offsetOfUTCOffsetInMinute()) \
    macro(DirectArguments_callee, DirectArguments::offsetOfCallee()) \
    macro(DirectArguments_length, DirectArguments::offsetOfLength()) \
    macro(DirectArguments_minCapacity, DirectArguments::offsetOfMinCapacity()) \
    macro(DirectArguments_mappedArguments, DirectArguments::offsetOfMappedArguments()) \
    macro(DirectArguments_modifiedArgumentsDescriptor, DirectArguments::offsetOfModifiedArgumentsDescriptor()) \
    macro(FunctionExecutable_rareData, FunctionExecutable::offsetOfRareData()) \
    macro(FunctionExecutableRareData_asString, FunctionExecutable::RareData::offsetOfAsString()) \
    macro(FunctionRareData_allocator, FunctionRareData::offsetOfObjectAllocationProfile() + ObjectAllocationProfileWithPrototype::offsetOfAllocator()) \
    macro(FunctionRareData_structure, FunctionRareData::offsetOfObjectAllocationProfile() + ObjectAllocationProfileWithPrototype::offsetOfStructure()) \
    macro(FunctionRareData_prototype, FunctionRareData::offsetOfObjectAllocationProfile() + ObjectAllocationProfileWithPrototype::offsetOfPrototype()) \
    macro(FunctionRareData_allocationProfileWatchpointSet, FunctionRareData::offsetOfAllocationProfileWatchpointSet()) \
    macro(FunctionRareData_executable, FunctionRareData::offsetOfExecutable()) \
    macro(FunctionRareData_internalFunctionAllocationProfile_structureID, FunctionRareData::offsetOfInternalFunctionAllocationProfile() + InternalFunctionAllocationProfile::offsetOfStructureID()) \
    macro(GetterSetter_getter, GetterSetter::offsetOfGetter()) \
    macro(GetterSetter_setter, GetterSetter::offsetOfSetter()) \
    macro(JSArrayBufferView_byteOffset, JSArrayBufferView::offsetOfByteOffset()) \
    macro(JSArrayBufferView_length, JSArrayBufferView::offsetOfLength()) \
    macro(JSArrayBufferView_mode, JSArrayBufferView::offsetOfMode()) \
    macro(JSArrayBufferView_vector, JSArrayBufferView::offsetOfVector()) \
    macro(JSBigInt_length, JSBigInt::offsetOfLength()) \
    macro(JSBoundFunction_targetFunction, JSBoundFunction::offsetOfTargetFunction()) \
    macro(JSBoundFunction_boundThis, JSBoundFunction::offsetOfBoundThis()) \
    macro(JSBoundFunction_boundArg0, JSBoundFunction::offsetOfBoundArgs() + sizeof(WriteBarrier<Unknown>) * 0) \
    macro(JSBoundFunction_boundArg1, JSBoundFunction::offsetOfBoundArgs() + sizeof(WriteBarrier<Unknown>) * 1) \
    macro(JSBoundFunction_boundArg2, JSBoundFunction::offsetOfBoundArgs() + sizeof(WriteBarrier<Unknown>) * 2) \
    macro(JSBoundFunction_nameMayBeNull, JSBoundFunction::offsetOfNameMayBeNull()) \
    macro(JSBoundFunction_length, JSBoundFunction::offsetOfLength()) \
    macro(JSBoundFunction_boundArgsLength, JSBoundFunction::offsetOfBoundArgsLength()) \
    macro(JSBoundFunction_canConstruct, JSBoundFunction::offsetOfCanConstruct()) \
    macro(JSCell_cellState, JSCell::cellStateOffset()) \
    macro(JSCell_header, 0) \
    macro(JSCell_indexingTypeAndMisc, JSCell::indexingTypeAndMiscOffset()) \
    macro(JSCell_structureID, JSCell::structureIDOffset()) \
    macro(JSCell_typeInfoFlags, JSCell::typeInfoFlagsOffset()) \
    macro(JSCell_typeInfoType, JSCell::typeInfoTypeOffset()) \
    macro(JSCell_usefulBytes, JSCell::indexingTypeAndMiscOffset()) \
    macro(JSFunction_executableOrRareData, JSFunction::offsetOfExecutableOrRareData()) \
    macro(JSFunction_scope, JSFunction::offsetOfScopeChain()) \
    macro(JSGlobalObject_regExpGlobalData_cachedResult_lastRegExp, JSGlobalObject::regExpGlobalDataOffset() + RegExpGlobalData::offsetOfCachedResult() + RegExpCachedResult::offsetOfLastRegExp()) \
    macro(JSGlobalObject_regExpGlobalData_cachedResult_lastInput, JSGlobalObject::regExpGlobalDataOffset() + RegExpGlobalData::offsetOfCachedResult() + RegExpCachedResult::offsetOfLastInput()) \
    macro(JSGlobalObject_regExpGlobalData_cachedResult_result_start, JSGlobalObject::regExpGlobalDataOffset() + RegExpGlobalData::offsetOfCachedResult() + RegExpCachedResult::offsetOfResult() + OBJECT_OFFSETOF(MatchResult, start)) \
    macro(JSGlobalObject_regExpGlobalData_cachedResult_result_end, JSGlobalObject::regExpGlobalDataOffset() + RegExpGlobalData::offsetOfCachedResult() + RegExpCachedResult::offsetOfResult() + OBJECT_OFFSETOF(MatchResult, end)) \
    macro(JSGlobalObject_regExpGlobalData_cachedResult_reified, JSGlobalObject::regExpGlobalDataOffset() + RegExpGlobalData::offsetOfCachedResult() + RegExpCachedResult::offsetOfReified()) \
    macro(JSGlobalProxy_target, JSGlobalProxy::targetOffset()) \
    macro(JSObject_butterfly, JSObject::butterflyOffset()) \
    macro(JSPropertyNameEnumerator_cachedInlineCapacity, JSPropertyNameEnumerator::cachedInlineCapacityOffset()) \
    macro(JSPropertyNameEnumerator_cachedPropertyNamesVector, JSPropertyNameEnumerator::cachedPropertyNamesVectorOffset()) \
    macro(JSPropertyNameEnumerator_cachedStructureID, JSPropertyNameEnumerator::cachedStructureIDOffset()) \
    macro(JSPropertyNameEnumerator_endGenericPropertyIndex, JSPropertyNameEnumerator::endGenericPropertyIndexOffset()) \
    macro(JSPropertyNameEnumerator_endStructurePropertyIndex, JSPropertyNameEnumerator::endStructurePropertyIndexOffset()) \
    macro(JSPropertyNameEnumerator_indexLength, JSPropertyNameEnumerator::indexedLengthOffset()) \
    macro(JSPropertyNameEnumerator_flags, JSPropertyNameEnumerator::flagsOffset()) \
    macro(JSRopeString_flags, JSRopeString::offsetOfFlags()) \
    macro(JSRopeString_length, JSRopeString::offsetOfLength()) \
    macro(JSRopeString_fiber0, JSRopeString::offsetOfFiber0()) \
    macro(JSRopeString_fiber1, JSRopeString::offsetOfFiber1()) \
    macro(JSRopeString_fiber2, JSRopeString::offsetOfFiber2()) \
    macro(JSScope_next, JSScope::offsetOfNext()) \
    macro(JSSymbolTableObject_symbolTable, JSSymbolTableObject::offsetOfSymbolTable()) \
    macro(JSWebAssemblyInstance_moduleRecord, JSWebAssemblyInstance::offsetOfModuleRecord()) \
    macro(NativeExecutable_asString, NativeExecutable::offsetOfAsString()) \
    macro(RegExpObject_regExpAndFlags, RegExpObject::offsetOfRegExpAndFlags()) \
    macro(RegExpObject_lastIndex, RegExpObject::offsetOfLastIndex()) \
    macro(ShadowChicken_Packet_callee, OBJECT_OFFSETOF(ShadowChicken::Packet, callee)) \
    macro(ShadowChicken_Packet_frame, OBJECT_OFFSETOF(ShadowChicken::Packet, frame)) \
    macro(ShadowChicken_Packet_callerFrame, OBJECT_OFFSETOF(ShadowChicken::Packet, callerFrame)) \
    macro(ShadowChicken_Packet_thisValue, OBJECT_OFFSETOF(ShadowChicken::Packet, thisValue)) \
    macro(ShadowChicken_Packet_scope, OBJECT_OFFSETOF(ShadowChicken::Packet, scope)) \
    macro(ShadowChicken_Packet_codeBlock, OBJECT_OFFSETOF(ShadowChicken::Packet, codeBlock)) \
    macro(ShadowChicken_Packet_callSiteIndex, OBJECT_OFFSETOF(ShadowChicken::Packet, callSiteIndex)) \
    macro(ScopedArguments_overrodeThings, ScopedArguments::offsetOfOverrodeThings()) \
    macro(ScopedArguments_scope, ScopedArguments::offsetOfScope()) \
    macro(ScopedArguments_storage, ScopedArguments::offsetOfStorage()) \
    macro(ScopedArguments_table, ScopedArguments::offsetOfTable()) \
    macro(ScopedArguments_totalLength, ScopedArguments::offsetOfTotalLength()) \
    macro(ScopedArgumentsTable_arguments, ScopedArgumentsTable::offsetOfArguments()) \
    macro(ScopedArgumentsTable_length, ScopedArgumentsTable::offsetOfLength()) \
    macro(StringImpl_data, StringImpl::dataOffset()) \
    macro(StringImpl_hashAndFlags, StringImpl::flagsOffset()) \
    macro(StringImpl_length, StringImpl::lengthMemoryOffset()) \
    macro(Structure_bitField, Structure::bitFieldOffset()) \
    macro(Structure_classInfo, Structure::classInfoOffset()) \
    macro(Structure_globalObject, Structure::globalObjectOffset()) \
    macro(Structure_indexingModeIncludingHistory, Structure::indexingModeIncludingHistoryOffset()) \
    macro(Structure_inlineCapacity, Structure::inlineCapacityOffset()) \
    macro(Structure_outOfLineTypeFlags, Structure::outOfLineTypeFlagsOffset()) \
    macro(Structure_previousOrRareData, Structure::previousOrRareDataOffset()) \
    macro(Structure_propertyHash, Structure::propertyHashOffset()) \
    macro(Structure_prototype, Structure::prototypeOffset()) \
    macro(Structure_seenProperties, Structure::seenPropertiesOffset()) \
    macro(StructureRareData_cachedEnumerableStrings, StructureRareData::offsetOfCachedPropertyNames(CachedPropertyNamesKind::EnumerableStrings)) \
    macro(StructureRareData_cachedStrings, StructureRareData::offsetOfCachedPropertyNames(CachedPropertyNamesKind::Strings)) \
    macro(StructureRareData_cachedSymbols, StructureRareData::offsetOfCachedPropertyNames(CachedPropertyNamesKind::Symbols)) \
    macro(StructureRareData_cachedStringsAndSymbols, StructureRareData::offsetOfCachedPropertyNames(CachedPropertyNamesKind::StringsAndSymbols)) \
    macro(StructureRareData_cachedPropertyNameEnumeratorAndFlag, StructureRareData::offsetOfCachedPropertyNameEnumeratorAndFlag()) \
    macro(StructureRareData_specialPropertyCache, StructureRareData::offsetOfSpecialPropertyCache()) \
    macro(SpecialPropertyCache_cachedToStringTagValue, SpecialPropertyCache::offsetOfCache(CachedSpecialPropertyKey::ToStringTag) + SpecialPropertyCacheEntry::offsetOfValue()) \
    macro(JSMap_butterfly, (JSMap::offsetOfButterfly())) \
    macro(JSSet_butterfly, (JSSet::offsetOfButterfly())) \
    macro(VM_heap_barrierThreshold, VM::offsetOfHeapBarrierThreshold()) \
    macro(VM_heap_mutatorShouldBeFenced, VM::offsetOfHeapMutatorShouldBeFenced()) \
    macro(VM_exception, VM::exceptionOffset()) \
    macro(WeakMapImpl_capacity, WeakMapImpl<WeakMapBucket<WeakMapBucketDataKey>>::offsetOfCapacity()) \
    macro(WeakMapImpl_buffer,  WeakMapImpl<WeakMapBucket<WeakMapBucketDataKey>>::offsetOfBuffer()) \
    macro(WeakMapBucket_value, WeakMapBucket<WeakMapBucketDataKeyValue>::offsetOfValue()) \
    macro(WeakMapBucket_key, WeakMapBucket<WeakMapBucketDataKeyValue>::offsetOfKey()) \
    macro(WebAssemblyModuleRecord_exportsObject, WebAssemblyModuleRecord::offsetOfExportsObject()) \
    macro(Symbol_symbolImpl, Symbol::offsetOfSymbolImpl()) \

#define FOR_EACH_INDEXED_ABSTRACT_HEAP(macro) \
    macro(ArrayStorage_vector, ArrayStorage::vectorOffset(), sizeof(WriteBarrier<Unknown>)) \
    macro(CompleteSubspace_allocatorForSizeStep, CompleteSubspace::offsetOfAllocatorForSizeStep(), sizeof(Allocator)) \
    macro(DirectArguments_storage, DirectArguments::storageOffset(), sizeof(EncodedJSValue)) \
    macro(JSLexicalEnvironment_variables, JSLexicalEnvironment::offsetOfVariables(), sizeof(EncodedJSValue)) \
    macro(JSPropertyNameEnumerator_cachedPropertyNamesVectorContents, 0, sizeof(WriteBarrier<JSString>)) \
    macro(JSInternalFieldObjectImpl_internalFields, JSInternalFieldObjectImpl<>::offsetOfInternalFields(), sizeof(WriteBarrier<Unknown>)) \
    macro(ScopedArguments_Storage_storage, 0, sizeof(EncodedJSValue)) \
    macro(WriteBarrierBuffer_bufferContents, 0, sizeof(JSCell*)) \
    macro(characters8, 0, sizeof(LChar)) \
    macro(characters16, 0, sizeof(UChar)) \
    macro(indexedInt32Properties, 0, sizeof(EncodedJSValue)) \
    macro(indexedDoubleProperties, 0, sizeof(double)) \
    macro(indexedContiguousProperties, 0, sizeof(EncodedJSValue)) \
    macro(scopedArgumentsTableArguments, 0, sizeof(int32_t)) \
    macro(singleCharacterStrings, 0, sizeof(JSString*)) \
    macro(structureTable, 0, sizeof(Structure*)) \
    macro(variables, 0, sizeof(Register)) \
    macro(HasOwnPropertyCache, 0, sizeof(HasOwnPropertyCache::Entry)) \
    macro(SmallIntCache, 0, sizeof(NumericStrings::StringWithJSString)) \
    
#define FOR_EACH_NUMBERED_ABSTRACT_HEAP(macro) \
    macro(properties)
    
// This class is meant to be cacheable between compilations, but it doesn't have to be.
// Doing so saves on creation of nodes. But clearing it will save memory.

class AbstractHeapRepository {
    WTF_MAKE_NONCOPYABLE(AbstractHeapRepository);
public:
    AbstractHeapRepository();
    ~AbstractHeapRepository();
    
    AbstractHeap root;
    
#define ABSTRACT_HEAP_DECLARATION(name) AbstractHeap name;
    FOR_EACH_ABSTRACT_HEAP(ABSTRACT_HEAP_DECLARATION)
#undef ABSTRACT_HEAP_DECLARATION

#define ABSTRACT_FIELD_DECLARATION(name, offset) AbstractHeap name;
    FOR_EACH_ABSTRACT_FIELD(ABSTRACT_FIELD_DECLARATION)
#undef ABSTRACT_FIELD_DECLARATION
    
    AbstractHeap& JSCell_freeListNext;
    AbstractHeap& ArrayStorage_publicLength;
    AbstractHeap& ArrayStorage_vectorLength;
    
#define INDEXED_ABSTRACT_HEAP_DECLARATION(name, offset, size) IndexedAbstractHeap name;
    FOR_EACH_INDEXED_ABSTRACT_HEAP(INDEXED_ABSTRACT_HEAP_DECLARATION)
#undef INDEXED_ABSTRACT_HEAP_DECLARATION
    
#define NUMBERED_ABSTRACT_HEAP_DECLARATION(name) NumberedAbstractHeap name;
    FOR_EACH_NUMBERED_ABSTRACT_HEAP(NUMBERED_ABSTRACT_HEAP_DECLARATION)
#undef NUMBERED_ABSTRACT_HEAP_DECLARATION

    AbstractHeap& JSString_value;
    AbstractHeap& JSWrapperObject_internalValue;

    AbsoluteAbstractHeap absolute;
    
    IndexedAbstractHeap* forIndexingType(IndexingType indexingType)
    {
        switch (indexingType) {
        case ALL_BLANK_INDEXING_TYPES:
        case ALL_UNDECIDED_INDEXING_TYPES:
            return nullptr;
            
        case ALL_INT32_INDEXING_TYPES:
            return &indexedInt32Properties;
            
        case ALL_DOUBLE_INDEXING_TYPES:
            return &indexedDoubleProperties;
            
        case ALL_CONTIGUOUS_INDEXING_TYPES:
            return &indexedContiguousProperties;
            
        case ALL_ARRAY_STORAGE_INDEXING_TYPES:
            return &ArrayStorage_vector;
            
        default:
            RELEASE_ASSERT_NOT_REACHED();
            return nullptr;
        }
    }
    
    IndexedAbstractHeap& forArrayType(DFG::Array::Type type)
    {
        switch (type) {
        case DFG::Array::Int32:
            return indexedInt32Properties;
        case DFG::Array::Double:
            return indexedDoubleProperties;
        case DFG::Array::Contiguous:
            return indexedContiguousProperties;
        case DFG::Array::ArrayStorage:
        case DFG::Array::SlowPutArrayStorage:
            return ArrayStorage_vector;
        default:
            RELEASE_ASSERT_NOT_REACHED();
            return indexedInt32Properties;
        }
    }

    void decorateMemory(const AbstractHeap*, B3::Value*);
    void decorateCCallRead(const AbstractHeap*, B3::Value*);
    void decorateCCallWrite(const AbstractHeap*, B3::Value*);
    void decoratePatchpointRead(const AbstractHeap*, B3::Value*);
    void decoratePatchpointWrite(const AbstractHeap*, B3::Value*);
    void decorateFenceRead(const AbstractHeap*, B3::Value*);
    void decorateFenceWrite(const AbstractHeap*, B3::Value*);
    void decorateFencedAccess(const AbstractHeap*, B3::Value*);

    void computeRangesAndDecorateInstructions();

private:

    struct HeapForValue {
        HeapForValue()
        {
        }

        HeapForValue(const AbstractHeap* heap, B3::Value* value)
            : heap(heap)
            , value(value)
        {
        }
        
        const AbstractHeap* heap { nullptr };
        B3::Value* value { nullptr };
    };

    Vector<HeapForValue> m_heapForMemory;
    Vector<HeapForValue> m_heapForCCallRead;
    Vector<HeapForValue> m_heapForCCallWrite;
    Vector<HeapForValue> m_heapForPatchpointRead;
    Vector<HeapForValue> m_heapForPatchpointWrite;
    Vector<HeapForValue> m_heapForFenceRead;
    Vector<HeapForValue> m_heapForFenceWrite;
    Vector<HeapForValue> m_heapForFencedAccess;
};

} } // namespace JSC::FTL

#endif // ENABLE(FTL_JIT)
