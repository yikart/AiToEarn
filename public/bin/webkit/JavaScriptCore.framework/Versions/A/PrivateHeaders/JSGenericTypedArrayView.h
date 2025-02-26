/*
 * Copyright (C) 2013-2023 Apple Inc. All rights reserved.
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

#include "JSArrayBufferView.h"
#include "ThrowScope.h"
#include "ToNativeFromValue.h"
#include <wtf/CheckedArithmetic.h>

namespace JSC {

#define JSC_DECLARE_CLASS_INFO_FUNCTION(type) \
    JS_EXPORT_PRIVATE const ClassInfo* get##type##ArrayClassInfo(); \
    JS_EXPORT_PRIVATE const ClassInfo* getResizableOrGrowableShared##type##ArrayClassInfo();
FOR_EACH_TYPED_ARRAY_TYPE_EXCLUDING_DATA_VIEW(JSC_DECLARE_CLASS_INFO_FUNCTION)
#undef JSC_DECLARE_CLASS_INFO_FUNCTION

// A typed array view is our representation of a typed array object as seen
// from JavaScript. For example:
//
// var o = new Int8Array(100);
//
// Here, 'o' points to a JSGenericTypedArrayView<int8_t>.
//
// Views contain five fields:
//
//     Structure* S     // from JSCell
//     Butterfly* B     // from JSObject
//     ElementType* V
//     size_t L
//     TypedArrayMode M
//
// These fields take up a total of five pointer-width words. FIXME: Make
// it take less words!
//
// B is usually unused but may stored some additional "overflow" data for
// one of the modes. V always points to the base of the typed array's data,
// and may point to either GC-managed copied space, or data in the C heap;
// which of those things it points to is governed by the mode although for
// simple accesses to the view you can just read from the pointer either
// way. M specifies the mode of the view. L is the length, in units that
// depend on the view's type.

// The JSGenericTypedArrayView is templatized by an Adaptor that controls
// the element type and how it's converted; it should obey the following
// interface; I use int8_t as an example:
//
// struct Adaptor {
//     typedef int8_t Type;
//     typedef Int8Array ViewType;
//     typedef JSInt8Array JSViewType;
//     static int8_t toNativeFromInt32(int32_t);
//     static int8_t toNativeFromUint32(uint32_t);
//     static int8_t toNativeFromDouble(double);
//     static int8_t toNativeFromUndefined();
//     static JSValue toJSValue(int8_t);
//     template<T> static T::Type convertTo(uint8_t);
// };

template<typename PassedAdaptor>
class JSGenericTypedArrayView : public JSArrayBufferView {
public:
    using Base = JSArrayBufferView;
    using Adaptor = PassedAdaptor;
    using ElementType = typename Adaptor::Type;
    static constexpr TypedArrayContentType contentType = Adaptor::contentType;

    static constexpr unsigned StructureFlags = Base::StructureFlags | OverridesGetOwnPropertySlot | OverridesGetOwnPropertyNames | OverridesPut | InterceptsGetOwnPropertySlotByIndexEvenWhenLengthIsNotZero;

    static constexpr unsigned elementSize = sizeof(typename Adaptor::Type);

    static JSGenericTypedArrayView* create(JSGlobalObject*, Structure*, size_t length);
    static JSGenericTypedArrayView* createWithFastVector(JSGlobalObject*, Structure*, size_t length, void* vector);
    static JSGenericTypedArrayView* createUninitialized(JSGlobalObject*, Structure*, size_t length);
    static JSGenericTypedArrayView* create(JSGlobalObject*, Structure*, RefPtr<ArrayBuffer>&&, size_t byteOffset, std::optional<size_t> length);
    static JSGenericTypedArrayView* create(VM&, Structure*, RefPtr<typename Adaptor::ViewType>&& impl);
    static JSGenericTypedArrayView* create(Structure*, JSGlobalObject*, RefPtr<typename Adaptor::ViewType>&& impl);
    
    inline size_t byteLength() const;
    inline size_t byteLengthRaw() const;
    
    inline const typename Adaptor::Type* typedVector() const;
    inline typename Adaptor::Type* typedVector();

    std::span<const typename Adaptor::Type> typedSpan() const { return unsafeMakeSpan(typedVector(), length()); }
    std::span<typename Adaptor::Type> typedSpan() { return unsafeMakeSpan(typedVector(), length()); }

    inline bool inBounds(size_t) const;

    // These methods are meant to match indexed access methods that JSObject
    // supports - hence the slight redundancy.
    inline bool canGetIndexQuickly(size_t) const;
    inline bool canSetIndexQuickly(size_t, JSValue) const;
    inline typename Adaptor::Type getIndexQuicklyAsNativeValue(size_t) const;
    inline JSValue getIndexQuickly(size_t) const;
    inline void setIndexQuicklyToNativeValue(size_t, typename Adaptor::Type);
    inline void setIndexQuickly(size_t, JSValue);
    inline bool setIndex(JSGlobalObject*, size_t, JSValue);

    static inline ElementType toAdaptorNativeFromValue(JSGlobalObject*, JSValue);
    static inline std::optional<ElementType> toAdaptorNativeFromValueWithoutCoercion(JSValue);

    enum class SortResult { Success, OutOfMemory, Failed };
    inline SortResult sort();

    inline bool canAccessRangeQuickly(size_t offset, size_t length);
    
    // Like canSetQuickly, except: if it returns false, it will throw the
    // appropriate exception.
    bool validateRange(JSGlobalObject*, size_t offset, size_t length);

    // Returns true if successful, and false on error; if it returns false
    // then it will have thrown an exception.
    bool setFromTypedArray(JSGlobalObject*, size_t offset, JSArrayBufferView*, size_t objectOffset, size_t length, CopyType);
    bool setFromArrayLike(JSGlobalObject*, size_t offset, JSObject*, size_t objectOffset, size_t length);
    bool setFromArrayLike(JSGlobalObject*, size_t offset, JSValue source);
    
    RefPtr<typename Adaptor::ViewType> possiblySharedTypedImpl();
    RefPtr<typename Adaptor::ViewType> unsharedTypedImpl();

    static inline Structure* createStructure(VM&, JSGlobalObject*, JSValue prototype);
    
    static const ClassInfo s_info; // This is never accessed directly, since that would break linkage on some compilers.
    static inline const ClassInfo* info();

    template<typename CellType, SubspaceAccess mode> static inline GCClient::IsoSubspace* subspaceFor(VM&);
    
    ArrayBuffer* existingBuffer();

    static constexpr TypedArrayType TypedArrayStorageType = Adaptor::typeValue;

    // This is the default DOM unwrapping. It calls toUnsharedNativeTypedView().
    static inline RefPtr<typename Adaptor::ViewType> toWrapped(VM&, JSValue);

    // [AllowShared] annotation allows accepting TypedArray originated from SharedArrayBuffer.
    static inline RefPtr<typename Adaptor::ViewType> toWrappedAllowShared(VM&, JSValue);

    inline void copyFromInt32ShapeArray(size_t offset, JSArray*, size_t objectOffset, size_t length);
    inline void copyFromDoubleShapeArray(size_t offset, JSArray*, size_t objectOffset, size_t length);
    
protected:
    friend struct TypedArrayClassInfos;

    JSGenericTypedArrayView(VM&, ConstructionContext&);

    static bool getOwnPropertySlot(JSObject*, JSGlobalObject*, PropertyName, PropertySlot&);
    static bool put(JSCell*, JSGlobalObject*, PropertyName, JSValue, PutPropertySlot&);
    static bool defineOwnProperty(JSObject*, JSGlobalObject*, PropertyName, const PropertyDescriptor&, bool shouldThrow);
    static bool deleteProperty(JSCell*, JSGlobalObject*, PropertyName, DeletePropertySlot&);

    static bool getOwnPropertySlotByIndex(JSObject*, JSGlobalObject*, unsigned propertyName, PropertySlot&);
    static bool putByIndex(JSCell*, JSGlobalObject*, unsigned propertyName, JSValue, bool shouldThrow);
    static bool deletePropertyByIndex(JSCell*, JSGlobalObject*, unsigned propertyName);
    
    static void getOwnPropertyNames(JSObject*, JSGlobalObject*, PropertyNameArray&, DontEnumPropertiesMode);

    static size_t estimatedSize(JSCell*, VM&);
    DECLARE_VISIT_CHILDREN;

    // Returns true if successful, and false on error; it will throw on error.
    template<typename OtherAdaptor>
    bool setWithSpecificType(
        JSGlobalObject*, size_t offset, JSGenericTypedArrayView<OtherAdaptor>*,
        size_t objectOffset, size_t length, CopyType);

    // The ECMA 6 spec states that floating point Typed Arrays should have the following ordering:
    //
    // -Inifinity < negative finite numbers < -0.0 < 0.0 < positive finite numbers < Infinity < NaN
    // Note: regardless of the sign or exact representation of a NaN it is greater than all other values.
    //
    // An interesting fact about IEEE 754 floating point numbers is that have an adjacent representation
    // i.e. for any finite floating point x there does not exist a finite floating point y such that
    // ((float) ((int) x + 1)) > y > x (where int represents a signed bit integer with the same number
    // of bits as float). Thus, if we have an array of floating points if we view it as an
    // array of signed bit integers it will sort in the format we desire. Note, denormal
    // numbers fit this property as they are floating point numbers with a exponent field of all
    // zeros so they will be closer to the signed zeros than any normalized number.
    //
    // All the processors we support, however, use twos complement. Fortunately, if you compare a signed
    // bit number as if it were twos complement the result will be correct assuming both numbers are not
    // negative. e.g.
    //
    //    - <=> - = reversed (-30 > -20 = true)
    //    + <=> + = ordered (30 > 20 = true)
    //    - <=> + = ordered (-30 > 20 = false)
    //    + <=> - = ordered (30 > -20 = true)
    //
    // For NaN, we normalize the NaN to a peticular representation; the sign bit is 0, all exponential bits
    // are 1 and only the MSB of the mantissa is 1. So, NaN is recognized as the largest integral numbers.

    template<typename IntegralType> inline void sortFloat(ElementType* begin, ElementType* end);
};

template<typename PassedAdaptor>
class JSGenericResizableOrGrowableSharedTypedArrayView final : public JSGenericTypedArrayView<PassedAdaptor> {
public:
    using Base = JSGenericTypedArrayView<PassedAdaptor>;
    using Base::StructureFlags;

    static constexpr bool isResizableOrGrowableSharedTypedArray = true;

    static const ClassInfo s_info; // This is never accessed directly, since that would break linkage on some compilers.

    static inline const ClassInfo* info();
    static inline Structure* createStructure(VM&, JSGlobalObject*, JSValue prototype);

    static bool preventExtensions(JSObject*, JSGlobalObject*);
};

template<typename Adaptor> inline RefPtr<typename Adaptor::ViewType> toPossiblySharedNativeTypedView(VM&, JSValue);
template<typename Adaptor> inline RefPtr<typename Adaptor::ViewType> toUnsharedNativeTypedView(VM&, JSValue);

} // namespace JSC
