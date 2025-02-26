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

#include "BooleanObject.h"

namespace JSC {

class BooleanPrototype final : public BooleanObject {
public:
    using Base = BooleanObject;
    static constexpr unsigned StructureFlags = Base::StructureFlags | HasStaticPropertyTable;

    static BooleanPrototype* create(VM& vm, JSGlobalObject* globalObject, Structure* structure)
    {
        BooleanPrototype* prototype = new (NotNull, allocateCell<BooleanPrototype>(vm)) BooleanPrototype(vm, structure);
        prototype->finishCreation(vm, globalObject);
        return prototype;
    }
        
    DECLARE_INFO;

    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue);

private:
    BooleanPrototype(VM&, Structure*);
    void finishCreation(VM&, JSGlobalObject*);
};
STATIC_ASSERT_ISO_SUBSPACE_SHARABLE(BooleanPrototype, BooleanObject);

} // namespace JSC
