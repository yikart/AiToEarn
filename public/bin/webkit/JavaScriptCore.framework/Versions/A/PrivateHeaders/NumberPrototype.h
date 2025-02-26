/*
 *  Copyright (C) 1999-2000 Harri Porten (porten@kde.org)
 *  Copyright (C) 2008-2021 Apple Inc. All rights reserved.
 *
 *  This library is free software; you can redistribute it and/or
 *  modify it under the terms of the GNU Lesser General Public
 *  License as published by the Free Software Foundation; either
 *  version 2 of the License, or (at your option) any later version.
 *
 *  This library is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 *  Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public
 *  License along with this library; if not, write to the Free Software
 *  Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 *
 */

#pragma once

#include "NumberObject.h"

namespace JSC {

class NumberPrototype final : public NumberObject {
public:
    using Base = NumberObject;
    static constexpr unsigned StructureFlags = Base::StructureFlags | HasStaticPropertyTable;

    static NumberPrototype* create(VM& vm, JSGlobalObject* globalObject, Structure* structure)
    {
        NumberPrototype* prototype = new (NotNull, allocateCell<NumberPrototype>(vm)) NumberPrototype(vm, structure);
        prototype->finishCreation(vm, globalObject);
        return prototype;
    }

    DECLARE_INFO;

    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue);

private:
    NumberPrototype(VM&, Structure*);
    void finishCreation(VM&, JSGlobalObject*);
};
STATIC_ASSERT_ISO_SUBSPACE_SHARABLE(NumberPrototype, NumberObject);

JSC_DECLARE_HOST_FUNCTION(numberProtoFuncValueOf);
JSC_DECLARE_HOST_FUNCTION(numberProtoFuncToString);
JSString* int32ToString(VM&, int32_t value, int32_t radix);
JSString* int52ToString(VM&, int64_t value, int32_t radix);
JSString* numberToString(VM&, double value, int32_t radix);
String toStringWithRadix(double doubleValue, int32_t radix);
int32_t extractToStringRadixArgument(JSGlobalObject*, JSValue radixValue, ThrowScope&);

} // namespace JSC
