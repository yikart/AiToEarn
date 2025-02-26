/*
 *  Copyright (C) 1999-2000 Harri Porten (porten@kde.org)
 *  Copyright (C) 2008-2023 Apple Inc. All rights reserved.
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

#include "JSWrapperObject.h"

namespace JSC {

class NumberObject : public JSWrapperObject {
protected:
    NumberObject(VM&, Structure*);
#if ASSERT_ENABLED
    void finishCreation(VM&);
#endif

public:
    using Base = JSWrapperObject;

    template<typename, SubspaceAccess mode>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return &vm.numberObjectSpace();
    }

    static NumberObject* create(VM& vm, Structure* structure)
    {
        NumberObject* number = new (NotNull, allocateCell<NumberObject>(vm)) NumberObject(vm, structure);
        number->finishCreation(vm);
        return number;
    }

    DECLARE_EXPORT_INFO;

    static Structure* createStructure(VM& vm, JSGlobalObject* globalObject, JSValue prototype)
    {
        return Structure::create(vm, globalObject, prototype, TypeInfo(NumberObjectType, StructureFlags), info());
    }
};
static_assert(sizeof(NumberObject) == sizeof(JSWrapperObject));

JS_EXPORT_PRIVATE NumberObject* constructNumber(JSGlobalObject*, JSValue);

} // namespace JSC
