/*
 *  Copyright (C) 1999-2000 Harri Porten (porten@kde.org)
 *  Copyright (C) 2007-2019 Apple Inc. All rights reserved.
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

#include "JSArray.h"

namespace JSC {

class ArrayPrototype final : public JSArray {
public:
    using Base = JSArray;

    enum class SpeciesWatchpointStatus {
        Uninitialized,
        Initialized,
        Fired
    };

    static ArrayPrototype* create(VM&, JSGlobalObject*, Structure*);
        
    DECLARE_EXPORT_INFO;

    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue);

private:
    ArrayPrototype(VM&, Structure*);
    void finishCreation(VM&, JSGlobalObject*);
};
STATIC_ASSERT_ISO_SUBSPACE_SHARABLE(ArrayPrototype, ArrayPrototype::Base);

JSC_DECLARE_HOST_FUNCTION(arrayProtoFuncToString);
JSC_DECLARE_HOST_FUNCTION(arrayProtoFuncValues);
JSC_DECLARE_HOST_FUNCTION(arrayProtoPrivateFuncAppendMemcpy);
JSC_DECLARE_HOST_FUNCTION(arrayProtoPrivateFuncFromFastFillWithUndefined);
JSC_DECLARE_HOST_FUNCTION(arrayProtoPrivateFuncFromFastFillWithEmpty);

} // namespace JSC
