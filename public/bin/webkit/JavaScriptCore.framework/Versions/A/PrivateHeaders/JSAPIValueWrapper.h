/*
 *  Copyright (C) 1999-2001 Harri Porten (porten@kde.org)
 *  Copyright (C) 2001 Peter Kelly (pmk@post.com)
 *  Copyright (C) 2003-2022 Apple Inc. All rights reserved.
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

#include "CallFrame.h"
#include "JSCJSValue.h"
#include "JSCast.h"
#include "Structure.h"

namespace JSC {

class JSAPIValueWrapper final : public JSCell {
    friend JSValue jsAPIValueWrapper(JSGlobalObject*, JSValue);
public:
    using Base = JSCell;
    static constexpr unsigned StructureFlags = Base::StructureFlags | StructureIsImmortal;

    template<typename CellType, SubspaceAccess mode>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return vm.apiValueWrapperSpace<mode>();
    }

    JSValue value() const { return m_value.get(); }

    static Structure* createStructure(VM&, JSGlobalObject*, JSValue);

    DECLARE_EXPORT_INFO;

    static JSAPIValueWrapper* create(VM& vm, JSValue value)
    {
        JSAPIValueWrapper* wrapper = new (NotNull, allocateCell<JSAPIValueWrapper>(vm)) JSAPIValueWrapper(vm, value);
        wrapper->finishCreation(vm);
        ASSERT(!value.isCell());
        return wrapper;
    }

private:
    JSAPIValueWrapper(VM& vm, JSValue value)
        : JSCell(vm, vm.apiWrapperStructure.get())
        , m_value(value, WriteBarrierEarlyInit)
    {
    }

    DECLARE_DEFAULT_FINISH_CREATION;

    WriteBarrier<Unknown> m_value;
};

} // namespace JSC
