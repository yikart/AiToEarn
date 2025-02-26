/*
 * Copyright (C) 2012-2023 Apple Inc. All rights reserved.
 * Copyright (C) 2015-2016 Yusuke Suzuki <utatane.tea@gmail.com>.
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

#include "ErrorType.h"
#include "JSString.h"
#include "PrivateName.h"
#include <wtf/Expected.h>

namespace JSC {

class Symbol final : public JSCell {
public:
    typedef JSCell Base;
    static constexpr unsigned StructureFlags = Base::StructureFlags | StructureIsImmortal | OverridesPut;

    DECLARE_EXPORT_INFO;

    static constexpr bool needsDestruction = true;

    template<typename CellType, SubspaceAccess mode>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return vm.symbolSpace<mode>();
    }

    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue);

    static Symbol* create(VM&);
    static Symbol* createWithDescription(VM&, const String&);
    JS_EXPORT_PRIVATE static Symbol* create(VM&, SymbolImpl& uid);

    SymbolImpl& uid() const { return m_privateName.uid(); }
    PrivateName privateName() const { return m_privateName; }
    String descriptiveString() const;
    String description() const;
    Expected<String, ErrorTypeWithExtension> tryGetDescriptiveString() const;

    JSValue toPrimitive(JSGlobalObject*, PreferredPrimitiveType) const;
    JSObject* toObject(JSGlobalObject*) const;
    double toNumber(JSGlobalObject*) const;

    static constexpr ptrdiff_t offsetOfSymbolImpl()
    {
        // PrivateName is just a Ref<SymbolImpl> which can just be used as a SymbolImpl*.
        return OBJECT_OFFSETOF(Symbol, m_privateName);
    }

private:
    static void destroy(JSCell*);

    Symbol(VM&);
    Symbol(VM&, const String&);
    Symbol(VM&, SymbolImpl& uid);

    void finishCreation(VM&);

    PrivateName m_privateName;
};

Symbol* asSymbol(JSValue);

inline Symbol* asSymbol(JSValue value)
{
    ASSERT(value.asCell()->isSymbol());
    return jsCast<Symbol*>(value.asCell());
}

} // namespace JSC
