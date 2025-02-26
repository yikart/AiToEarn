/*
 *  Copyright (C) 1999-2000 Harri Porten (porten@kde.org)
 *  Copyright (C) 2008-2022 Apple Inc. All rights reserved.
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

#include "JSObject.h"

namespace JSC {

class ObjectPrototype final : public JSNonFinalObject {
public:
    using Base = JSNonFinalObject;
    static constexpr unsigned StructureFlags = Base::StructureFlags | IsImmutablePrototypeExoticObject;

    template<typename CellType, SubspaceAccess>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        STATIC_ASSERT_ISO_SUBSPACE_SHARABLE(ObjectPrototype, Base);
        return &vm.plainObjectSpace();
    }

    static ObjectPrototype* create(VM&, JSGlobalObject*, Structure*);

    DECLARE_EXPORT_INFO;

    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue);

private:
    ObjectPrototype(VM&, Structure*);
    void finishCreation(VM&, JSGlobalObject*);
};

JS_EXPORT_PRIVATE JSC_DECLARE_HOST_FUNCTION(objectProtoFuncToString);
JSString* objectPrototypeToString(JSGlobalObject*, JSValue thisValue);
bool objectPrototypeHasOwnProperty(JSGlobalObject*, JSObject* base, const Identifier& property);

} // namespace JSC
