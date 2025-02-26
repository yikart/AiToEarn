/*
 *  Copyright (C) 2006 Maks Orlovich
 *  Copyright (C) 2006-2021 Apple Inc. All rights reserved.
 *
 *  This library is free software; you can redistribute it and/or
 *  modify it under the terms of the GNU Library General Public
 *  License as published by the Free Software Foundation; either
 *  version 2 of the License, or (at your option) any later version.
 *
 *  This library is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 *  Library General Public License for more details.
 *
 *  You should have received a copy of the GNU Library General Public License
 *  along with this library; see the file COPYING.LIB.  If not, write to
 *  the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 *  Boston, MA 02110-1301, USA.
 *
 */

#pragma once

#include "JSInternalFieldObjectImpl.h"

namespace JSC {

// This class is used as a base for classes such as String,
// Number, Boolean and Symbol which are wrappers for primitive types.
class JSWrapperObject : public JSInternalFieldObjectImpl<1> {
public:
    using Base = JSInternalFieldObjectImpl<1>;

    template<typename, SubspaceAccess>
    static void subspaceFor(VM&)
    {
        RELEASE_ASSERT_NOT_REACHED();
    }

    static size_t allocationSize(Checked<size_t> inlineCapacity)
    {
        ASSERT_UNUSED(inlineCapacity, !inlineCapacity);
        return sizeof(JSWrapperObject);
    }

    enum class Field : uint32_t {
        WrappedValue = 0,
    };
    static_assert(numberOfInternalFields == 1);

    JSValue internalValue() const;
    void setInternalValue(VM&, JSValue);

    static constexpr ptrdiff_t internalValueOffset() { return offsetOfInternalField(static_cast<unsigned>(Field::WrappedValue)); }
    static constexpr ptrdiff_t internalValueCellOffset()
    {
#if USE(JSVALUE64)
        return internalValueOffset();
#else
        return internalValueOffset() + OBJECT_OFFSETOF(EncodedValueDescriptor, asBits.payload);
#endif
    }

protected:
    explicit JSWrapperObject(VM&, Structure*);

    DECLARE_VISIT_CHILDREN_WITH_MODIFIER(JS_EXPORT_PRIVATE);
};

inline JSWrapperObject::JSWrapperObject(VM& vm, Structure* structure)
    : Base(vm, structure)
{
}

inline JSValue JSWrapperObject::internalValue() const
{
    return internalField(static_cast<unsigned>(Field::WrappedValue)).get();
}

inline void JSWrapperObject::setInternalValue(VM& vm, JSValue value)
{
    ASSERT(value);
    ASSERT(!value.isObject());
    internalField(static_cast<unsigned>(Field::WrappedValue)).set(vm, this, value);
}

} // namespace JSC
