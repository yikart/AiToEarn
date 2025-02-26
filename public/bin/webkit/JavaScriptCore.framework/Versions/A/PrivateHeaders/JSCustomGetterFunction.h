/*
 * Copyright (C) 2015-2022 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "JSFunction.h"

namespace JSC {

class JSCustomGetterFunction final : public JSFunction {
public:
    typedef JSFunction Base;
    static constexpr unsigned StructureFlags = Base::StructureFlags;

    using CustomFunctionPointer = GetValueFunc;

    static constexpr bool needsDestruction = true;
    static void destroy(JSCell*);

    template<typename CellType, SubspaceAccess mode>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return vm.customGetterFunctionSpace<mode>();
    }

    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue);

    JS_EXPORT_PRIVATE static JSCustomGetterFunction* create(VM&, JSGlobalObject*, const PropertyName&, CustomFunctionPointer, std::optional<DOMAttributeAnnotation> = std::nullopt);

    DECLARE_EXPORT_INFO;

    const Identifier& propertyName() const { return m_propertyName; }
    CustomFunctionPointer getter() const { return m_getter; };
    CustomFunctionPointer customFunctionPointer() const { return m_getter; };
    std::optional<DOMAttributeAnnotation> domAttribute() const { return m_domAttribute; };
    const ClassInfo* slotBaseClassInfoIfExists() const
    {
        if (m_domAttribute)
            return m_domAttribute->classInfo;
        return nullptr;
    }

private:
    JSCustomGetterFunction(VM&, NativeExecutable*, JSGlobalObject*, Structure*, const PropertyName&, CustomFunctionPointer, std::optional<DOMAttributeAnnotation>);

    Identifier m_propertyName;
    CustomFunctionPointer m_getter;
    std::optional<DOMAttributeAnnotation> m_domAttribute;
};

} // namespace JSC
