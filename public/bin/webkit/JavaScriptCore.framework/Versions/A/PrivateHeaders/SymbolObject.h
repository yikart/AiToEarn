/*
 *  Copyright (C) 1999-2000 Harri Porten (porten@kde.org)
 *  Copyright (C) 2007-2022 Apple Inc. All rights reserved.
 *  Copyright (C) 2015 Yusuke Suzuki <utatane.tea@gmail.com>.
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
#include "Symbol.h"

namespace JSC {

class SymbolObject final : public JSWrapperObject {
public:
    using Base = JSWrapperObject;

    template<typename, SubspaceAccess mode>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return vm.symbolObjectSpace<mode>();
    }

    static SymbolObject* create(VM& vm, Structure* structure)
    {
        Symbol* symbol = Symbol::create(vm);
        SymbolObject* object = new (NotNull, allocateCell<SymbolObject>(vm)) SymbolObject(vm, structure);
        object->finishCreation(vm, symbol);
        return object;
    }
    static SymbolObject* create(VM& vm, Structure* structure, Symbol* symbol)
    {
        SymbolObject* object = new (NotNull, allocateCell<SymbolObject>(vm)) SymbolObject(vm, structure);
        object->finishCreation(vm, symbol);
        return object;
    }

    DECLARE_EXPORT_INFO;

    Symbol* internalValue() const { return asSymbol(JSWrapperObject::internalValue()); }

    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue);

private:
    JS_EXPORT_PRIVATE void finishCreation(VM&, Symbol*);
    JS_EXPORT_PRIVATE SymbolObject(VM&, Structure*);
};
static_assert(sizeof(SymbolObject) == sizeof(JSWrapperObject));

} // namespace JSC
