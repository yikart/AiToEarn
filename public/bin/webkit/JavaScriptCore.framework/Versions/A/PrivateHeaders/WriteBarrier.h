/*
 * Copyright (C) 2011-2023 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "GCAssertions.h"
#include "HandleTypes.h"
#include "StructureID.h"
#include <type_traits>
#include <wtf/RawPtrTraits.h>
#include <wtf/RawValueTraits.h>
#include <wtf/TZoneMalloc.h>

namespace JSC {

namespace DFG {
class DesiredWriteBarrier;
}

class JSCell;
class VM;
class JSGlobalObject;

template<class T>
using WriteBarrierTraitsSelect = typename std::conditional<std::is_same<T, Unknown>::value,
    RawValueTraits<T>, RawPtrTraits<T>
>::type;

template<class T, typename Traits = WriteBarrierTraitsSelect<T>> class WriteBarrierBase;
template<> class WriteBarrierBase<JSValue>;

JS_EXPORT_PRIVATE void slowValidateCell(JSCell*);
JS_EXPORT_PRIVATE void slowValidateCell(JSGlobalObject*);
    
#if ENABLE(GC_VALIDATION)
template<class T> inline void validateCell(T cell)
{
    ASSERT_GC_OBJECT_INHERITS(cell, std::remove_pointer<T>::type::info());
}

template<> inline void validateCell<JSCell*>(JSCell* cell)
{
    slowValidateCell(cell);
}

template<> inline void validateCell<JSGlobalObject*>(JSGlobalObject* globalObject)
{
    slowValidateCell(globalObject);
}
#else
template<class T> inline void validateCell(T)
{
}
#endif

enum WriteBarrierEarlyInitTag { WriteBarrierEarlyInit };

// We have a separate base class with no constructors for use in Unions.
template <typename T, typename Traits> class WriteBarrierBase {
    using StorageType = typename Traits::StorageType;

public:
    void set(VM&, const JSCell* owner, T* value);
    
    // This is meant to be used like operator=, but is called copyFrom instead, in
    // order to kindly inform the C++ compiler that its advice is not appreciated.
    void copyFrom(const WriteBarrierBase& other)
    {
        // FIXME add version with different Traits once needed.
        Traits::exchange(m_cell, other.m_cell);
    }

    void setMayBeNull(VM&, const JSCell* owner, T* value);

    // Should only be used by JSCell during early initialisation
    // when some basic types aren't yet completely instantiated
    void setEarlyValue(VM&, const JSCell* owner, T* value);
    
    T* get() const
    {
        // Copy m_cell to a local to avoid multiple-read issues. (See <http://webkit.org/b/110854>)
        StorageType cell = this->cell();
        if (cell)
            validateCell(reinterpret_cast<JSCell*>(static_cast<void*>(Traits::unwrap(cell))));
        return Traits::unwrap(cell);
    }

    T* operator*() const
    {
        StorageType cell = this->cell();
        ASSERT(cell);
        auto unwrapped = Traits::unwrap(cell);
        validateCell<T>(unwrapped);
        return Traits::unwrap(unwrapped);
    }

    T* operator->() const
    {
        StorageType cell = this->cell();
        ASSERT(cell);
        auto unwrapped = Traits::unwrap(cell);
        validateCell(unwrapped);
        return unwrapped;
    }

    void clear() { Traits::exchange(m_cell, nullptr); }

    // Slot cannot be used when pointers aren't stored as-is.
    template<typename BarrierT, typename BarrierTraits, std::enable_if_t<std::is_same<BarrierTraits, RawPtrTraits<BarrierT>>::value, void*> = nullptr>
    struct SlotHelper {
        static BarrierT** reinterpret(typename BarrierTraits::StorageType* cell) { return reinterpret_cast<T**>(cell); }
    };

    T** slot()
    {
        return SlotHelper<T, Traits>::reinterpret(&m_cell);
    }
    
    explicit operator bool() const { return !!cell(); }
    
    bool operator!() const { return !cell(); }

    void setWithoutWriteBarrier(T* value)
    {
#if ENABLE(WRITE_BARRIER_PROFILING)
        WriteBarrierCounters::usesWithoutBarrierFromCpp.count();
#endif
        Traits::exchange(this->m_cell, value);
    }

    T* unvalidatedGet() const { return Traits::unwrap(cell()); }

private:
    StorageType cell() const { return m_cell; }

    StorageType m_cell;
};

template <> class WriteBarrierBase<Unknown, RawValueTraits<Unknown>> {
public:
    void set(VM&, const JSCell* owner, JSValue);
    void setWithoutWriteBarrier(JSValue value)
    {
        m_value = JSValue::encode(value);
    }

    JSValue get() const
    {
#if USE(JSVALUE64) || !ENABLE(CONCURRENT_JS)
        return JSValue::decode(m_value);
#else
        return JSValue::decodeConcurrent(&m_value);
#endif
    }
    void clear() { m_value = JSValue::encode(JSValue()); }
    void setUndefined() { m_value = JSValue::encode(jsUndefined()); }
    void setStartingValue(JSValue value) { m_value = JSValue::encode(value); }
    bool isNumber() const { return get().isNumber(); }
    bool isInt32() const { return get().isInt32(); }
    bool isObject() const { return get().isObject(); }
    bool isNull() const { return get().isNull(); }
    bool isGetterSetter() const { return get().isGetterSetter(); }
    bool isCustomGetterSetter() const { return get().isCustomGetterSetter(); }
    
    JSValue* slot() const
    { 
        return std::bit_cast<JSValue*>(&m_value);
    }
    
    int32_t* tagPointer() { return &std::bit_cast<EncodedValueDescriptor*>(&m_value)->asBits.tag; }
    int32_t* payloadPointer() { return &std::bit_cast<EncodedValueDescriptor*>(&m_value)->asBits.payload; }
    
    explicit operator bool() const { return !!get(); }
    bool operator!() const { return !get(); } 
    
private:
    EncodedJSValue m_value;
};

template <typename T, typename Traits = WriteBarrierTraitsSelect<T>>
class WriteBarrier : public WriteBarrierBase<T, Traits> {
    WTF_MAKE_TZONE_ALLOCATED(WriteBarrier);
public:
    WriteBarrier()
    {
        this->setWithoutWriteBarrier(nullptr);
    }

    WriteBarrier(VM& vm, const JSCell* owner, T* value)
    {
        this->set(vm, owner, value);
    }

    WriteBarrier(DFG::DesiredWriteBarrier&, T* value)
    {
        ASSERT(isCompilationThread());
        this->setWithoutWriteBarrier(value);
    }

    enum MayBeNullTag { MayBeNull };
    WriteBarrier(VM& vm, const JSCell* owner, T* value, MayBeNullTag)
    {
        this->setMayBeNull(vm, owner, value);
    }

    WriteBarrier(T* value, WriteBarrierEarlyInitTag)
    {
        this->setWithoutWriteBarrier(value);
    }
};

enum UndefinedWriteBarrierTagType { UndefinedWriteBarrierTag };
enum NullWriteBarrierTagType { NullWriteBarrierTag };
template <>
class WriteBarrier<Unknown, RawValueTraits<Unknown>> : public WriteBarrierBase<Unknown, RawValueTraits<Unknown>> {
    WTF_MAKE_TZONE_ALLOCATED(WriteBarrier);
public:
    WriteBarrier()
    {
        this->setWithoutWriteBarrier(JSValue());
    }
    WriteBarrier(UndefinedWriteBarrierTagType)
    {
        this->setWithoutWriteBarrier(jsUndefined());
    }
    WriteBarrier(NullWriteBarrierTagType)
    {
        this->setWithoutWriteBarrier(jsNull());
    }

    WriteBarrier(VM& vm, const JSCell* owner, JSValue value)
    {
        this->set(vm, owner, value);
    }

    WriteBarrier(DFG::DesiredWriteBarrier&, JSValue value)
    {
        ASSERT(isCompilationThread());
        this->setWithoutWriteBarrier(value);
    }

    WriteBarrier(JSValue value, WriteBarrierEarlyInitTag)
    {
        this->setWithoutWriteBarrier(value);
    }
};

template <typename U, typename V, typename TraitsU, typename TraitsV>
inline bool operator==(const WriteBarrierBase<U, TraitsU>& lhs, const WriteBarrierBase<V, TraitsV>& rhs)
{
    return lhs.get() == rhs.get();
}

class WriteBarrierStructureID {
public:
    constexpr WriteBarrierStructureID() = default;

    WriteBarrierStructureID(VM& vm, const JSCell* owner, Structure* value)
    {
        set(vm, owner, value);
    }

    WriteBarrierStructureID(DFG::DesiredWriteBarrier&, Structure* value)
    {
        ASSERT(isCompilationThread());
        setWithoutWriteBarrier(value);
    }

    enum MayBeNullTag { MayBeNull };
    WriteBarrierStructureID(VM& vm, const JSCell* owner, Structure* value, MayBeNullTag)
    {
        setMayBeNull(vm, owner, value);
    }

    WriteBarrierStructureID(Structure* value, WriteBarrierEarlyInitTag)
    {
        setWithoutWriteBarrier(value);
    }

    void set(VM&, const JSCell* owner, Structure* value);

    void setMayBeNull(VM&, const JSCell* owner, Structure* value);

    // Should only be used by JSCell during early initialisation
    // when some basic types aren't yet completely instantiated
    void setEarlyValue(VM&, const JSCell* owner, Structure* value);

    Structure* get() const
    {
        // Copy m_structureID to a local to avoid multiple-read issues. (See <http://webkit.org/b/110854>)
        StructureID structureID = value();
        if (structureID) {
            Structure* structure = structureID.decode();
            validateCell(reinterpret_cast<JSCell*>(structure));
            return structure;
        }
        return nullptr;
    }

    Structure* operator*() const
    {
        StructureID structureID = value();
        ASSERT(structureID);
        Structure* structure = structureID.decode();
        validateCell(reinterpret_cast<JSCell*>(structure));
        return structure;
    }

    Structure* operator->() const
    {
        StructureID structureID = value();
        ASSERT(structureID);
        Structure* structure = structureID.decode();
        validateCell(reinterpret_cast<JSCell*>(structure));
        return structure;
    }

    void clear()
    {
        m_structureID = { };
    }

    explicit operator bool() const
    {
        return !!value();
    }

    bool operator!() const
    {
        return !value();
    }

    void setWithoutWriteBarrier(Structure* value)
    {
#if ENABLE(WRITE_BARRIER_PROFILING)
        WriteBarrierCounters::usesWithoutBarrierFromCpp.count();
#endif
        if (!value) {
            m_structureID = { };
            return;
        }
        m_structureID = StructureID::encode(value);
    }

    Structure* unvalidatedGet() const
    {
        StructureID structureID = value();
        if (structureID)
            return structureID.decode();
        return nullptr;
    }

    StructureID value() const { return m_structureID; }

private:
    StructureID m_structureID;
};

} // namespace JSC

namespace WTF {

template<typename T> struct VectorTraits<JSC::WriteBarrier<T>> : public SimpleClassVectorTraits {
    static_assert(std::is_trivially_destructible<JSC::WriteBarrier<T>>::value);
    static constexpr bool canCopyWithMemcpy = true;
};

template<> struct VectorTraits<JSC::WriteBarrier<JSC::Unknown>> : public SimpleClassVectorTraits {
    static_assert(std::is_trivially_destructible<JSC::WriteBarrier<JSC::Unknown>>::value);
#if USE(JSVALUE32_64)
    // We can memset only in JSVALUE64 since empty value is zero. On the other hand, JSVALUE32_64's empty value is not zero.
    static constexpr bool canInitializeWithMemset = false;
#endif
    static constexpr bool canCopyWithMemcpy = true;
};

} // namespace WTF
