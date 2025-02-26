/*
 *  Copyright (C) 1999-2000 Harri Porten (porten@kde.org)
 *  Copyright (C) 2003-2023 Apple Inc. All Rights Reserved.
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
#include "RegExp.h"
#include "ThrowScope.h"
#include "TypeError.h"

namespace JSC {
    
class RegExpObject final : public JSNonFinalObject {
public:
    using Base = JSNonFinalObject;
    static constexpr unsigned StructureFlags = Base::StructureFlags | OverridesGetOwnPropertySlot | OverridesGetOwnSpecialPropertyNames | OverridesPut;

    template<typename CellType, SubspaceAccess mode>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        static_assert(!CellType::needsDestruction);
        return &vm.regExpObjectSpace();
    }

    static constexpr uintptr_t lastIndexIsNotWritableFlag = 0b01;
    static constexpr uintptr_t legacyFeaturesDisabledFlag = 0b10;
    static constexpr uintptr_t flagsMask = lastIndexIsNotWritableFlag | legacyFeaturesDisabledFlag;
    static constexpr uintptr_t regExpMask = ~flagsMask;

    static RegExpObject* create(VM& vm, Structure* structure, RegExp* regExp, bool areLegacyFeaturesEnabled = true)
    {
        RegExpObject* object = new (NotNull, allocateCell<RegExpObject>(vm)) RegExpObject(vm, structure, regExp, areLegacyFeaturesEnabled);
        object->finishCreation(vm);
        return object;
    }

    static RegExpObject* create(VM& vm, Structure* structure, RegExp* regExp, JSValue lastIndex)
    {
        static constexpr bool areLegacyFeaturesEnabled = true;
        auto* object = create(vm, structure, regExp, areLegacyFeaturesEnabled);
        object->m_lastIndex.set(vm, object, lastIndex);
        return object;
    }

    void setRegExp(VM& vm, RegExp* regExp)
    {
        uintptr_t result = (m_regExpAndFlags & flagsMask) | std::bit_cast<uintptr_t>(regExp);
        m_regExpAndFlags = result;
        vm.writeBarrier(this, regExp);
    }

    RegExp* regExp() const
    {
        return std::bit_cast<RegExp*>(m_regExpAndFlags & regExpMask);
    }

    bool setLastIndex(JSGlobalObject* globalObject, size_t lastIndex)
    {
        VM& vm = getVM(globalObject);
        auto scope = DECLARE_THROW_SCOPE(vm);

        if (LIKELY(lastIndexIsWritable())) {
            m_lastIndex.setWithoutWriteBarrier(jsNumber(lastIndex));
            return true;
        }
        throwTypeError(globalObject, scope, ReadonlyPropertyWriteError);
        return false;
    }
    bool setLastIndex(JSGlobalObject* globalObject, JSValue lastIndex, bool shouldThrow)
    {
        VM& vm = getVM(globalObject);
        auto scope = DECLARE_THROW_SCOPE(vm);

        if (LIKELY(lastIndexIsWritable())) {
            m_lastIndex.set(vm, this, lastIndex);
            return true;
        }
        return typeError(globalObject, scope, shouldThrow, ReadonlyPropertyWriteError);
    }
    JSValue getLastIndex() const
    {
        return m_lastIndex.get();
    }

    bool test(JSGlobalObject* globalObject, JSString* string) { return !!match(globalObject, string); }
    bool testInline(JSGlobalObject* globalObject, JSString* string) { return !!matchInline(globalObject, string); }
    JS_EXPORT_PRIVATE JSValue exec(JSGlobalObject*, JSString*);
    JSValue execInline(JSGlobalObject*, JSString*);
    MatchResult match(JSGlobalObject*, JSString*);
    JSValue matchGlobal(JSGlobalObject*, JSString*);

    static bool getOwnPropertySlot(JSObject*, JSGlobalObject*, PropertyName, PropertySlot&);
    static bool put(JSCell*, JSGlobalObject*, PropertyName, JSValue, PutPropertySlot&);

    DECLARE_EXPORT_INFO;

    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue);

    static constexpr ptrdiff_t offsetOfRegExpAndFlags()
    {
        return OBJECT_OFFSETOF(RegExpObject, m_regExpAndFlags);
    }

    static constexpr ptrdiff_t offsetOfLastIndex()
    {
        return OBJECT_OFFSETOF(RegExpObject, m_lastIndex);
    }

    static size_t allocationSize(Checked<size_t> inlineCapacity)
    {
        ASSERT_UNUSED(inlineCapacity, !inlineCapacity);
        return sizeof(RegExpObject);
    }

    bool areLegacyFeaturesEnabled() const { return !(m_regExpAndFlags & legacyFeaturesDisabledFlag); }

private:
    JS_EXPORT_PRIVATE RegExpObject(VM&, Structure*, RegExp*, bool areLegacyFeaturesEnabled);
#if ASSERT_ENABLED
    JS_EXPORT_PRIVATE void finishCreation(VM&);
#endif

    DECLARE_VISIT_CHILDREN;

    bool lastIndexIsWritable() const
    {
        return !(m_regExpAndFlags & lastIndexIsNotWritableFlag);
    }

    void setLastIndexIsNotWritable()
    {
        m_regExpAndFlags = (m_regExpAndFlags | lastIndexIsNotWritableFlag);
    }

    JS_EXPORT_PRIVATE static bool deleteProperty(JSCell*, JSGlobalObject*, PropertyName, DeletePropertySlot&);
    JS_EXPORT_PRIVATE static void getOwnSpecialPropertyNames(JSObject*, JSGlobalObject*, PropertyNameArray&, DontEnumPropertiesMode);
    JS_EXPORT_PRIVATE static bool defineOwnProperty(JSObject*, JSGlobalObject*, PropertyName, const PropertyDescriptor&, bool shouldThrow);

    MatchResult matchInline(JSGlobalObject*, JSString*);

    uintptr_t m_regExpAndFlags { 0 };
    WriteBarrier<Unknown> m_lastIndex;
};

} // namespace JSC
